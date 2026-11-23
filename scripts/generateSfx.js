import fs from 'node:fs';
import path from 'node:path';

/**
 * Procedural Audio Generator (Zero-Dependency).
 * Mensintesis efek suara (SFX) & BGM menjadi file WAV 16-bit 44.1kHz
 * langsung ke folder assets/audio/.
 */

const SAMPLE_RATE = 44100;
const OUT_DIR = path.resolve('assets/audio');

function createRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Menyimpan Float32Array (-1..1) menjadi file WAV PCM 16-bit mono.
 */
function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

/**
 * 1. SFX Menggali Tanah (Sekop): ritme tusukan & gesekan kerikil tanah.
 */
function generateDig(duration = 3.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(101);
  const hits = [0.1, 0.78, 1.46, 2.14, 2.65];

  for (const hitTime of hits) {
    const startIdx = Math.floor(hitTime * SAMPLE_RATE);
    const len = Math.floor(0.38 * SAMPLE_RATE);
    let lp = 0;

    for (let i = 0; i < len && startIdx + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.sin(Math.min(1, t / 0.04) * (Math.PI / 2)) * Math.exp(-t * 8.5);
      // Thump rendah saat sekop menghantam tanah
      const thump = Math.sin(2 * Math.PI * (120 - t * 180) * t) * Math.exp(-t * 24) * 0.65;
      // Gesekan tanah/kerikil (low-pass noise)
      const white = rand() * 2 - 1;
      lp = lp * 0.72 + white * 0.28;
      const crunch = (white - lp) * 0.55 + lp * 0.45;
      out[startIdx + i] += (thump + crunch * 0.75) * env;
    }
  }
  return out;
}

/**
 * 2. SFX Sampah Jatuh ("plop / pop" kartun) sesuai timing 6 sisa dapur.
 */
function generateDrop(duration = 3.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const drops = [0.55, 1.05, 1.55, 2.05, 2.45, 2.82];

  drops.forEach((dropTime, idx) => {
    const startIdx = Math.floor(dropTime * SAMPLE_RATE);
    const len = Math.floor(0.16 * SAMPLE_RATE);
    const baseFreq = 260 + (idx % 3) * 55;

    for (let i = 0; i < len && startIdx + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 28);
      // Pitch naik cepat seperti bunyi "blop!"
      const freq = baseFreq + t * 1400;
      const phase = 2 * Math.PI * (baseFreq * t + 700 * t * t);
      out[startIdx + i] += Math.sin(phase) * env * 0.75;
    }
  });
  return out;
}

/**
 * 3. SFX Hujan: pink-ish noise + rintik halus + fade in/out.
 */
function generateRain(duration = 4.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(303);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const white = rand() * 2 - 1;
    // Filter pink noise sederhana (suara hujan alami)
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.950 * b2 + white * 0.048;
    const rain = (b0 + b1 + b2 + white * 0.14) * 0.65;

    // Rintik air acak
    const droplet = rand() > 0.9985 ? (rand() * 2 - 1) * 0.6 : 0;

    // Fade in 0.4s & fade out 0.5s
    const fadeIn = Math.min(1, t / 0.4);
    const fadeOut = Math.min(1, (duration - t) / 0.5);
    out[i] = (rain + droplet) * fadeIn * fadeOut * 0.75;
  }
  return out;
}

/**
 * 4. SFX Gelembung Gas Metana: rentetan "bloop" lembut naik nada.
 */
function generateBubbles(duration = 3.2) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(404);

  for (let b = 0; b < 16; b++) {
    const startSec = 0.08 + b * 0.18 + (rand() - 0.5) * 0.07;
    const startIdx = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
    const len = Math.floor(0.11 * SAMPLE_RATE);
    const f0 = 320 + rand() * 260;
    const sweep = 1800 + rand() * 1400;

    for (let i = 0; i < len && startIdx + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.sin((i / len) * Math.PI) * Math.exp(-t * 14);
      const phase = 2 * Math.PI * (f0 * t + 0.5 * sweep * t * t);
      out[startIdx + i] += Math.sin(phase) * env * 0.55;
    }
  }
  return out;
}

/**
 * 5. SFX Kompor Gas Menyala: klik pemantik + "wush" api + desis biru stabil.
 */
function generateFlame(duration = 3.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  const rand = createRng(505);

  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const white = rand() * 2 - 1;

    // Klik pemantik di t = 0.02s
    const click =
      t >= 0.02 && t <= 0.045
        ? Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-(t - 0.02) * 140) * 0.8
        : 0;

    // Ledakan lembut "whoosh!" saat gas tersulut (t = 0.08s..0.45s)
    lp = lp * 0.92 + white * 0.08;
    lp2 = lp2 * 0.97 + lp * 0.03;
    const whooshEnv =
      t >= 0.08 ? Math.min(1, (t - 0.08) / 0.06) * Math.exp(-(t - 0.08) * 5.5) : 0;
    const whoosh = lp * whooshEnv * 2.4;

    // Desis api biru stabil
    const hissEnv =
      t >= 0.14
        ? Math.min(1, (t - 0.14) / 0.2) * Math.min(1, (duration - t) / 0.35)
        : 0;
    const hiss = (lp2 * 1.4 + white * 0.08) * hissEnv * 0.6;

    out[i] = click + whoosh + hiss;
  }
  return out;
}

/**
 * 6. BGM Instrumental Ringan (Loop 8 detik, 120 BPM, progresi C - G - Am - F).
 */
function generateBgm(duration = 8.0) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);

  // Nada arpeggio marimba lembut (Hz)
  const notes = [
    261.63, 329.63, 392.0, 523.25, // C
    392.0, 493.88, 587.33, 392.0,  // G
    220.0, 261.63, 329.63, 440.0,  // Am
    349.23, 440.0, 523.25, 349.23, // F
  ];
  const stepDur = duration / notes.length; // 0.5s per ketukan

  notes.forEach((freq, idx) => {
    const startIdx = Math.floor(idx * stepDur * SAMPLE_RATE);
    const len = Math.floor(stepDur * 1.2 * SAMPLE_RATE);

    for (let i = 0; i < len && startIdx + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / 0.012) * Math.exp(-t * 5.5);
      // Warm marimba tone (fundamental + harmonik lembut)
      const tone =
        Math.sin(2 * Math.PI * freq * t) * 0.65 +
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.2 +
        Math.sin(2 * Math.PI * (freq / 2) * t) * 0.25;
      out[startIdx + i] += tone * env * 0.45;
    }
  });

  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = [
    { name: 'sfx-dig.wav', data: generateDig(3.0) },
    { name: 'sfx-drop.wav', data: generateDrop(3.0) },
    { name: 'sfx-rain.wav', data: generateRain(4.0) },
    { name: 'sfx-bubbles.wav', data: generateBubbles(3.2) },
    { name: 'sfx-flame.wav', data: generateFlame(3.0) },
    { name: 'bgm.wav', data: generateBgm(8.0) },
  ];

  console.log('=== Procedural Audio Generator ===');
  for (const f of files) {
    const target = path.join(OUT_DIR, f.name);
    writeWav(target, f.data);
    console.log(`✓ Dibuat: assets/audio/${f.name}`);
  }
  console.log('\nSelesai! Jalankan `npm run preview` atau `npm run render` untuk mendengar hasilnya.');
}

main();
