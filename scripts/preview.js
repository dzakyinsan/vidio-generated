import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8787;

async function loadFreshConfig() {
  const cfgUrl = pathToFileURL(path.join(ROOT_DIR, 'config.js')).href;
  return import(`${cfgUrl}?t=${Date.now()}`);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

let activeRenderProcess = null;

async function handleRenderSSE(req, res, urlObj) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  if (activeRenderProcess) {
    send({ type: 'error', message: 'Sedang ada proses render yang berjalan. Tunggu sampai selesai.' });
    res.end();
    return;
  }

  const { getVideoConfig, SCENE_PRESETS } = await loadFreshConfig();
  const scene = urlObj.searchParams.get('scene') || 'lateDinner';
  if (!SCENE_PRESETS[scene]) {
    send({ type: 'error', message: `Scene "${scene}" tidak ditemukan.` });
    res.end();
    return;
  }

  const scaleParam = urlObj.searchParams.get('scale');
  const scale = scaleParam === '0.5' ? '0.5' : '1';
  const cfg = getVideoConfig(scene);

  send({ type: 'status', message: `Memulai render ${cfg.title || scene} (${scale === '1' ? '1080×1920' : '540×960'})...`, pct: 0 });

  const child = spawn(
    process.execPath,
    [path.join(ROOT_DIR, 'scripts', 'render.js'), '--scene', scene, '--scale', scale],
    { cwd: ROOT_DIR }
  );
  activeRenderProcess = child;

  let errorLog = '';
  const keepAlive = setInterval(() => {
    if (!res.writableEnded) res.write(': keepalive\n\n');
  }, 10000);

  const cleanup = () => {
    clearInterval(keepAlive);
    if (activeRenderProcess === child) {
      activeRenderProcess = null;
    }
  };

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const match = text.match(/Rendering frame (\d+)\/(\d+) \(([\d.]+)%\)/);
    if (match) {
      send({
        type: 'progress',
        frame: Number(match[1]),
        total: Number(match[2]),
        pct: Number(match[3]),
        message: `Rendering frame ${match[1]}/${match[2]} (${match[3]}%)`,
      });
    }
  });

  child.stderr.on('data', (chunk) => {
    errorLog += chunk.toString();
  });

  child.on('error', (err) => {
    cleanup();
    if (!res.writableEnded) {
      send({ type: 'error', message: err.message });
      res.end();
    }
  });

  child.on('close', (code) => {
    cleanup();
    if (res.writableEnded) return;
    if (code === 0) {
      const filename = path.basename(cfg.outputPath);
      send({
        type: 'done',
        pct: 100,
        filename,
        downloadUrl: `/api/download?scene=${encodeURIComponent(scene)}&t=${Date.now()}`,
        message: `Selesai! Mengunduh ${filename}...`,
      });
    } else {
      send({
        type: 'error',
        message: errorLog.trim() || `Render gagal (exit code ${code}). Pastikan sudah menjalankan "npm install".`,
      });
    }
    res.end();
  });

  res.on('close', () => {
    if (!res.writableEnded && activeRenderProcess === child && !child.killed) {
      child.kill();
      cleanup();
    }
  });
}

async function handleDownload(res, urlObj) {
  const { getVideoConfig } = await loadFreshConfig();
  const scene = urlObj.searchParams.get('scene') || 'lateDinner';
  const cfg = getVideoConfig(scene);
  const absPath = path.resolve(ROOT_DIR, cfg.outputPath);

  if (!absPath.startsWith(ROOT_DIR) || !fs.existsSync(absPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('File MP4 belum ditemukan. Klik Export MP4 terlebih dahulu.');
    return;
  }

  const stat = fs.statSync(absPath);
  const filename = path.basename(absPath);
  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(absPath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url || '/', `http://localhost:${PORT}`);
  const urlPath = urlObj.pathname;

  if (urlPath === '/api/render') {
    handleRenderSSE(req, res, urlObj);
    return;
  }
  if (urlPath === '/api/download') {
    handleDownload(res, urlObj);
    return;
  }

  const relPath =
    urlPath === '/'
      ? 'preview/index.html'
      : urlPath === '/studio3d'
      ? 'preview/studio3d.html'
      : urlPath === '/road3d'
      ? 'preview/road3d.html'
      : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT_DIR, relPath);

  // Cegah path traversal keluar dari root project
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\nLive Preview berjalan di: http://localhost:${PORT}`);
  console.log('Edit file di src/scenes/ lalu refresh browser untuk melihat perubahan instan.\n');
});
