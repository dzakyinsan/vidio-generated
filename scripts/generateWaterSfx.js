import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator untuk film "Bagaimana Air Bisa Sampai ke Rumah Kita?".
 * Menghasilkan sfx-water-tap.wav (air keran mengucur) & sfx-water-flow.wav (aliran sungai/pipa).
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve('assets/audio');

function createRng(seed = 3344) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

// 1. Suara air keran mengucur mengisi gelas
function generateWaterTap(duration = 5.5) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(551);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const white = rand() * 2 - 1;
    lp = lp * 0.78 + white * 0.22;
    // Resonansi gelas yang makin penuh (frekuensi perlahan naik)
    const pitch = 520 + (t / duration) * 420;
    const resonance = Math.sin(2 * Math.PI * pitch * t) * 0.14;
    const env = Math.min(1, t / 0.3) * Math.min(1, (duration - t) / 0.4);
    out[i] = (lp * 0.6 + resonance) * env * 0.55;
  }
  return out;
}

// 2. Aliran sungai & pengolahan air lembut
function generateWaterFlow(duration = 8.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(882);
  let b0 = 0, b1 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const w = rand() * 2 - 1;
    b0 = 0.99 * b0 + w * 0.04;
    b1 = 0.93 * b1 + w * 0.09;
    const swell = 0.8 + 0.2 * Math.sin(t * 2.2);
    const env = Math.min(1, t / 0.4) * Math.min(1, (duration - t) / 0.5);
    out[i] = (b0 + b1) * swell * env * 0.6;
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeWav(path.join(OUT_DIR, 'sfx-water-tap.wav'), generateWaterTap(5.5));
  writeWav(path.join(OUT_DIR, 'sfx-water-flow.wav'), generateWaterFlow(8.0));
  console.log('✓ Dibuat: assets/audio/sfx-water-tap.wav & sfx-water-flow.wav');
}

main();
