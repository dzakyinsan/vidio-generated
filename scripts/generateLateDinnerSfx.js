import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator khusus untuk video "Makan Malam Bikin Gemuk?".
 * Menghasilkan file WAV 16-bit 44.1kHz langsung ke assets/audio/.
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

// 1. Detak jam dinding dramatis + ding jam 7 (3.5 detik)
function generateClockTick(duration = 3.5) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const ticks = [0.2, 0.8, 1.4, 2.0, 2.6];

  ticks.forEach((sec, idx) => {
    const start = Math.floor(sec * SAMPLE_RATE);
    const freq = idx % 2 === 0 ? 1100 : 880;
    for (let i = 0; i < SAMPLE_RATE * 0.06 && start + i < n; i++) {
      const t = i / SAMPLE_RATE;
      out[start + i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 85) * 0.65;
    }
  });

  // Lonceng kecil di 2.2s saat melewati 19:00
  const dingStart = Math.floor(2.2 * SAMPLE_RATE);
  for (let i = 0; i < SAMPLE_RATE * 1.1 && dingStart + i < n; i++) {
    const t = i / SAMPLE_RATE;
    out[dingStart + i] +=
      (Math.sin(2 * Math.PI * 1046.5 * t) * 0.5 + Math.sin(2 * Math.PI * 2093 * t) * 0.2) *
      Math.exp(-t * 4.2) * 0.55;
  }
  return out;
}

// 2. Pop ceria saat hasil perbandingan 550 kkal = 550 kkal muncul
function generatePopEqual(duration = 1.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 440 + t * 900;
    const env = Math.exp(-t * 14);
    out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.6;
  }
  return out;
}

// 3. Suara gelembung lambung / warning lembut saat GERD
function generateRefluxAlert(duration = 2.8) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let b = 0; b < 8; b++) {
    const start = Math.floor((0.15 + b * 0.3) * SAMPLE_RATE);
    const f0 = 180 + (b % 3) * 65;
    for (let i = 0; i < SAMPLE_RATE * 0.16 && start + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.sin((i / (SAMPLE_RATE * 0.16)) * Math.PI);
      out[start + i] += Math.sin(2 * Math.PI * (f0 * t + 450 * t * t)) * env * 0.45;
    }
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = [
    { name: 'sfx-clock.wav', data: generateClockTick(3.5) },
    { name: 'sfx-pop-equal.wav', data: generatePopEqual(1.0) },
    { name: 'sfx-reflux.wav', data: generateRefluxAlert(2.8) },
  ];

  console.log('=== Procedural SFX Generator (Makan Malam Bikin Gemuk?) ===');
  for (const f of files) {
    writeWav(path.join(OUT_DIR, f.name), f.data);
    console.log(`✓ Dibuat: assets/audio/${f.name}`);
  }
}

main();
