/**
 * Menggambar watermark logo horizontal di pojok kiri atas (aman dari UI TikTok/Reels/Shorts).
 * Menjaga rasio aspek asli gambar agar tidak gepeng/tertarik.
 */
export function drawWatermark(ctx, config) {
  const wm = config.watermark;
  if (!wm || wm.enabled === false) return;

  const img = config._watermarkImage;
  if (!img || !img.width || !img.height) return;

  const drawH = wm.height ?? 78;
  const drawW = drawH * (img.width / img.height);
  const x = wm.x ?? 38;
  const y = wm.y ?? 108;
  const alpha = wm.opacity ?? 0.88;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(img, x, y, drawW, drawH);
  ctx.restore();
}
