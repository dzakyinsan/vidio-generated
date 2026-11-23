import { createCanvas, loadImage } from '@napi-rs/canvas';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getVideoConfig } from '../config.js';
import { renderFrame } from '../src/renderFrame.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

/**
 * Mengumpulkan semua track audio yang file-nya benar-benar ada di disk.
 */
function collectAudioTracks(config) {
  const tracks = [];
  const audio = config.audio || {};

  if (audio.voiceover?.file) {
    tracks.push({ label: 'Voiceover', ...audio.voiceover });
  }
  if (audio.bgm?.file) {
    tracks.push({ label: 'BGM', ...audio.bgm });
  }
  if (Array.isArray(audio.sfx)) {
    audio.sfx.forEach((item, idx) => {
      if (item?.file) {
        tracks.push({ label: `SFX #${idx + 1}`, ...item });
      }
    });
  }

  return tracks
    .map((t) => ({ ...t, absPath: path.resolve(t.file) }))
    .filter((t) => fs.existsSync(t.absPath));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const VIDEO_CONFIG = getVideoConfig(args.scene);

  const scale = args.scale ? Number(args.scale) : 1;
  const fps = args.fps ? Number(args.fps) : VIDEO_CONFIG.fps;
  const duration = args.duration ? Number(args.duration) : VIDEO_CONFIG.duration;
  const outputPath = args.out || VIDEO_CONFIG.outputPath;

  // Pastikan dimensi genap (syarat codec H.264 yuv420p)
  const renderWidth = Math.round((VIDEO_CONFIG.width * scale) / 2) * 2;
  const renderHeight = Math.round((VIDEO_CONFIG.height * scale) / 2) * 2;
  const totalFrames = Math.ceil(duration * fps);

  const absOutput = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absOutput), { recursive: true });

  const audioTracks = collectAudioTracks(VIDEO_CONFIG);

  console.log('=== Canvas Video Renderer ===');
  console.log(`Resolusi : ${renderWidth}x${renderHeight} (scale ${scale}x)`);
  console.log(`FPS      : ${fps}`);
  console.log(`Durasi   : ${duration}s (${totalFrames} frame)`);
  if (audioTracks.length > 0) {
    console.log(`Audio    : ${audioTracks.length} track aktif`);
    for (const t of audioTracks) {
      console.log(`           - [${t.label}] ${t.file} (start: ${t.start || 0}s, vol: ${t.volume ?? 1})`);
    }
  } else {
    console.log('Audio    : Tidak ada file audio ditemukan (render silent)');
  }
  console.log(`Output   : ${outputPath}\n`);

  const ffmpegArgs = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${renderWidth}x${renderHeight}`,
    '-r', String(fps),
    '-i', '-',
  ];

  // Tambahkan semua input audio (index 1..N)
  for (const track of audioTracks) {
    if (track.loop) {
      ffmpegArgs.push('-stream_loop', '-1');
    }
    ffmpegArgs.push('-i', track.absPath);
  }

  // Susun filter_complex untuk mixing multi-track audio (delay + trim + volume + amix)
  if (audioTracks.length > 0) {
    const filterParts = [];
    const mixLabels = [];

    audioTracks.forEach((track, idx) => {
      const inputIdx = idx + 1;
      const startSec = Math.max(0, Number(track.start || 0));
      const delayMs = Math.round(startSec * 1000);
      const vol = track.volume ?? 1.0;
      const outLabel = `a${idx}`;

      const chain = [];
      if (track.end !== undefined && track.end > startSec) {
        const clipLen = track.end - startSec;
        chain.push(`atrim=0:${clipLen.toFixed(3)}`, 'asetpts=PTS-STARTPTS');
      } else {
        const maxLen = Math.max(0.1, duration - startSec);
        chain.push(`atrim=0:${maxLen.toFixed(3)}`, 'asetpts=PTS-STARTPTS');
      }
      if (delayMs > 0) {
        chain.push(`adelay=${delayMs}|${delayMs}`);
      }
      chain.push(`volume=${vol}`);

      filterParts.push(`[${inputIdx}:a]${chain.join(',')}[${outLabel}]`);
      mixLabels.push(`[${outLabel}]`);
    });

    if (audioTracks.length === 1) {
      filterParts.push(`${mixLabels[0]}apad=whole_dur=${duration}[aout]`);
    } else {
      filterParts.push(
        `${mixLabels.join('')}amix=inputs=${audioTracks.length}:duration=longest:dropout_transition=0:normalize=0,atrim=0:${duration}[aout]`
      );
    }

    ffmpegArgs.push(
      '-filter_complex', filterParts.join(';'),
      '-map', '0:v:0',
      '-map', '[aout]'
    );
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', VIDEO_CONFIG.ffmpeg.preset || 'medium',
    '-crf', String(VIDEO_CONFIG.ffmpeg.crf ?? 20),
    '-movflags', '+faststart'
  );

  if (audioTracks.length > 0) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-t', String(duration));
  }

  ffmpegArgs.push(absOutput);

  const ffmpeg = spawn(ffmpegPath, ffmpegArgs, {
    stdio: ['pipe', 'ignore', 'pipe'],
  });

  let stderrLogs = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderrLogs += chunk.toString();
  });

  const ffmpegExit = new Promise((resolve, reject) => {
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg keluar dengan kode ${code}\n${stderrLogs}`));
    });
  });

  const canvas = createCanvas(renderWidth, renderHeight);
  const ctx = canvas.getContext('2d');

  // Preload watermark logo jika diaktifkan
  if (VIDEO_CONFIG.watermark?.enabled !== false && VIDEO_CONFIG.watermark?.file) {
    const wmAbs = path.resolve(VIDEO_CONFIG.watermark.file);
    if (fs.existsSync(wmAbs)) {
      VIDEO_CONFIG._watermarkImage = await loadImage(wmAbs);
    }
  }

  const startTime = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;

    ctx.save();
    ctx.scale(renderWidth / VIDEO_CONFIG.width, renderHeight / VIDEO_CONFIG.height);
    renderFrame(ctx, time, VIDEO_CONFIG);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, renderWidth, renderHeight);
    const buffer = Buffer.from(
      imageData.data.buffer,
      imageData.data.byteOffset,
      imageData.data.byteLength
    );

    if (!ffmpeg.stdin.write(buffer)) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }

    if (frame % Math.max(1, Math.floor(fps / 2)) === 0 || frame === totalFrames - 1) {
      const pct = (((frame + 1) / totalFrames) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\rRendering frame ${frame + 1}/${totalFrames} (${pct}%) — ${elapsed}s`);
    }
  }

  ffmpeg.stdin.end();
  await ffmpegExit;

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\nSelesai dalam ${totalSec} detik!`);
  console.log(`Video tersimpan di: ${absOutput}`);
}

main().catch((err) => {
  console.error('\nRender gagal:', err);
  process.exit(1);
});
