import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural SFX Generator khusus untuk video "Ngecas HP di Bawah Bantal".
 * Menghasilkan file WAV 16-bit 44.1kHz langsung ke assets/audio/.
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve('assets/audio');

function createRng(seed = 88) {
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

// 1. Bunyi notifikasi colok charger (ding-dong pendek)
function generatePlug(duration = 1.2) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const note1 = t < 0.25 ? Math.sin(2 * Math.PI * 660 * t) * Math.exp(-t * 10) : 0;
    const note2 = t >= 0.14 ? Math.sin(2 * Math.PI * 880 * (t - 0.14)) * Math.exp(-(t - 0.14) * 7) : 0;
    out[i] = (note1 + note2) * 0.55;
  }
  return out;
}

// 2. Dengung panas meningkat (overheat hum)
function generateHeatHum(duration = 4.5) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const k = t / duration;
    const freq = 95 + k * 140;
    const pulse = 0.65 + 0.35 * Math.sin(2 * Math.PI * (2 + k * 5) * t);
    const fade = Math.min(1, t / 0.4) * Math.min(1, (duration - t) / 0.4);
    out[i] = (Math.sin(2 * Math.PI * freq * t) * 0.5 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2) * pulse * fade * 0.45;
  }
  return out;
}

// 3. Korsleting baterai + percikan + desis asap/api
function generateSparkFire(duration = 6.5) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(606);
  let lp = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const white = rand() * 2 - 1;
    lp = lp * 0.93 + white * 0.07;

    // Percikan listrik acak di awal (0 - 3s)
    const crackle = t < 3.2 && rand() > 0.992 ? (rand() * 2 - 1) * 0.95 : 0;
    // Desis gas & api (2s - 6.5s)
    const fireEnv = t > 1.8 ? Math.min(1, (t - 1.8) / 0.5) * Math.min(1, (duration - t) / 0.6) : 0;
    const fire = (lp * 1.6 + white * 0.15) * fireEnv * 0.55;

    out[i] = crackle * 0.65 + fire;
  }
  return out;
}

// 4. Bunyi chime aman & sejuk
function generateSafeChime(duration = 2.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, idx) => {
    const start = Math.floor(idx * 0.11 * SAMPLE_RATE);
    for (let i = 0; i < SAMPLE_RATE * 0.9 && start + i < n; i++) {
      const t = i / SAMPLE_RATE;
      out[start + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5.5) * 0.35;
    }
  });
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = [
    { name: 'sfx-plug.wav', data: generatePlug(1.2) },
    { name: 'sfx-heat.wav', data: generateHeatHum(4.5) },
    { name: 'sfx-spark.wav', data: generateSparkFire(6.5) },
    { name: 'sfx-safe.wav', data: generateSafeChime(2.0) },
  ];

  console.log('=== Procedural SFX Generator (Ngecas HP di Bawah Bantal) ===');
  for (const f of files) {
    writeWav(path.join(OUT_DIR, f.name), f.data);
    console.log(`✓ Dibuat: assets/audio/${f.name}`);
  }
}

main();
