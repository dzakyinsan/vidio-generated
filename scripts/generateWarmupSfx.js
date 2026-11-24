import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator untuk video "Memanaskan Mesin Lama Tiap Pagi".
 * Menghasilkan sfx-engine-rev.wav (suara mesin digeber tinggi).
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

// Suara mesin digeber naik-turun (RPM tinggi)
function generateEngineRev(duration = 6.5) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const revWave = 0.5 + 0.5 * Math.sin(t * 2.4 - 0.8);
    const freq = 65 + revWave * 115;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const raw =
      Math.sin(phase) * 0.5 +
      Math.sin(phase * 2) * 0.3 +
      Math.sin(phase * 3) * 0.2;
    const env = Math.min(1, t / 0.3) * Math.min(1, (duration - t) / 0.4);
    out[i] = Math.tanh(raw * 1.6) * env * 0.48;
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeWav(path.join(OUT_DIR, 'sfx-engine-rev.wav'), generateEngineRev(6.5));
  console.log('✓ Dibuat: assets/audio/sfx-engine-rev.wav');
}

main();
