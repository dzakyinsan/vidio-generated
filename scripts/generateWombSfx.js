import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator untuk film "Bagaimana Janin Bisa Bernafas?".
 * Menghasilkan sfx-heartbeat.wav (detak jantung lembut lub-dub di dalam rahim).
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve('assets/audio');

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

// Detak jantung hangat "lub-dub ... lub-dub" (loopable 8 detik)
function generateHeartbeat(duration = 8.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);

  for (let beatStart = 0.2; beatStart < duration - 0.5; beatStart += 0.85) {
    // Lub (rendah hangat)
    const s1 = Math.floor(beatStart * SAMPLE_RATE);
    for (let i = 0; i < SAMPLE_RATE * 0.16 && s1 + i < n; i++) {
      const t = i / SAMPLE_RATE;
      out[s1 + i] += Math.sin(2 * Math.PI * (58 - t * 90) * t) * Math.exp(-t * 22) * 0.7;
    }
    // Dub (sedikit lebih tinggi & pendek)
    const s2 = Math.floor((beatStart + 0.22) * SAMPLE_RATE);
    for (let i = 0; i < SAMPLE_RATE * 0.13 && s2 + i < n; i++) {
      const t = i / SAMPLE_RATE;
      out[s2 + i] += Math.sin(2 * Math.PI * (72 - t * 110) * t) * Math.exp(-t * 28) * 0.52;
    }
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeWav(path.join(OUT_DIR, 'sfx-heartbeat.wav'), generateHeartbeat(8.0));
  console.log('✓ Dibuat: assets/audio/sfx-heartbeat.wav');
}

main();
