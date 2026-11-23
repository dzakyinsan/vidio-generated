import { easeInOutCubic, lerp, progress } from './math.js';

/**
 * Sistem Kamera 2D berbasis keyframe (pan X, pan Y, dan zoom).
 *
 * Contoh keyframe:
 * [
 *   { time: 0,  x: 540, y: 960, zoom: 1.0 },
 *   { time: 11, x: 540, y: 1180, zoom: 1.55, ease: easeInOutCubic },
 *   { time: 16, x: 960, y: 820, zoom: 1.45 },
 * ]
 *
 * (x, y) adalah titik dunia (world coordinate) yang ingin ditempatkan di tengah layar.
 */
export function evaluateCamera(keyframes, time) {
  if (!keyframes || keyframes.length === 0) {
    return { x: 540, y: 960, zoom: 1 };
  }
  if (time <= keyframes[0].time) {
    return { ...keyframes[0] };
  }
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) {
    return { ...last };
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (time >= a.time && time <= b.time) {
      const easeFn = b.ease || easeInOutCubic;
      const t = progress(time, a.time, b.time, easeFn);
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        zoom: lerp(a.zoom, b.zoom, t),
      };
    }
  }

  return { ...last };
}

/**
 * Menerapkan transformasi kamera ke CanvasRenderingContext2D.
 * Panggil ctx.save() sebelum ini dan ctx.restore() setelah selesai menggambar world.
 */
export function applyCamera(ctx, camera, viewportWidth, viewportHeight) {
  ctx.translate(viewportWidth / 2, viewportHeight / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
}
