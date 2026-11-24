import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator khusus untuk video "Campur Pertamax & Pertalite" (Mesin 4-Tak).
 * Menghasilkan:
 *  - sfx-fuel-pour.wav     : Suara bensin mengalir masuk ke tangki
 *  - sfx-engine-smooth.wav : Deruman mesin 4-tak halus
 *  - sfx-engine-knock.wav  : Deruman mesin + bunyi ngelitik metalik (knocking ping)
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve('assets/audio');

function createRng(seed = 771) {
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

// 1. Aliran bensin masuk ke tangki
function generateFuelPour(duration = 5.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(212);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const white = rand() * 2 - 1;
    lp = lp * 0.86 + white * 0.14;
    const glug = 0.75 + 0.25 * Math.sin(2 * Math.PI * (7 + t * 2) * t);
    const env = Math.min(1, t / 0.3) * Math.min(1, (duration - t) / 0.4);
    out[i] = lp * glug * env * 0.65;
  }
  return out;
}

// 2. Deruman mesin 4-tak halus
function generateEngineSmooth(duration = 7.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 48; // Low smooth rumble
    const env = Math.min(1, t / 0.4) * Math.min(1, (duration - t) / 0.4);
    const rumble =
      Math.sin(2 * Math.PI * f * t) * 0.55 +
      Math.sin(2 * Math.PI * f * 2 * t) * 0.28 +
      Math.sin(2 * Math.PI * f * 3 * t) * 0.14;
    const pulse = 0.7 + 0.3 * Math.sin(2 * Math.PI * 12 * t);
    out[i] = Math.tanh(rumble * 1.4) * pulse * env * 0.42;
  }
  return out;
}

// 3. Mesin + bunyi ngelitik metalik (knocking ping)
function generateEngineKnock(duration = 8.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const base = generateEngineSmooth(duration);

  for (let i = 0; i < n; i++) {
    out[i] = base[i];
  }

  // Tambahkan ketukan metalik "tik-tik-tik" (knocking) tiap ~0.42s
  for (let k = 0.3; k < duration - 0.3; k += 0.42) {
    const startIdx = Math.floor(k * SAMPLE_RATE);
    for (let i = 0; i < SAMPLE_RATE * 0.09 && startIdx + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const ping =
        (Math.sin(2 * Math.PI * 2450 * t) * 0.5 +
          Math.sin(2 * Math.PI * 3680 * t) * 0.35) *
        Math.exp(-t * 48);
      out[startIdx + i] += ping * 0.55;
    }
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = [
    { name: 'sfx-fuel-pour.wav', data: generateFuelPour(5.0) },
    { name: 'sfx-engine-smooth.wav', data: generateEngineSmooth(7.0) },
    { name: 'sfx-engine-knock.wav', data: generateEngineKnock(8.0) },
  ];
  console.log('=== Procedural SFX Generator (Campur Pertamax & Pertalite) ===');
  for (const f of files) {
    writeWav(path.join(OUT_DIR, f.name), f.data);
    console.log(`✓ Dibuat: assets/audio/${f.name}`);
  }
}

main();
