/**
 * Utilitas matematika, easing, dan animasi deterministik berbasis waktu (detik).
 * Semua fungsi bersifat murni (pure) agar hasil preview browser dan render Node.js 100% identik.
 */

export function clamp(val, min = 0, max = 1) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Menghitung progress 0..1 pada rentang waktu [start, end], opsional dengan fungsi easing.
 */
export function progress(time, start, end, easeFn = linear) {
  if (end <= start) return time >= end ? 1 : 0;
  const raw = clamp((time - start) / (end - start), 0, 1);
  return easeFn(raw);
}

/**
 * Interpolasi warna hex (#RRGGBB) dari a ke b dengan faktor t (0..1).
 */
export function lerpColor(hexA, hexB, t) {
  const k = clamp(t, 0, 1);
  const a = parseInt(hexA.replace('#', ''), 16);
  const b = parseInt(hexB.replace('#', ''), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(lerp(ar, br, k));
  const g = Math.round(lerp(ag, bg, k));
  const bl = Math.round(lerp(ab, bb, k));
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * Pseudo-random deterministik (Mulberry32) agar posisi batu, hujan, partikel
 * tidak berkedip-kedip antar frame.
 */
export function createRandom(seed = 12345) {
  let s = seed >>> 0;
  return function rand() {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Fungsi Easing ---

export const linear = (t) => t;

export const easeInQuad = (t) => t * t;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeOutBounce = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};
