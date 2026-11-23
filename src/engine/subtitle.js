/**
 * Renderer subtitle ala TikTok / Reels / Shorts dengan highlight kata aktif (karaoke).
 *
 * Format data subtitle:
 * [
 *   {
 *     start: 0.0,
 *     end: 3.4,
 *     words: [
 *       { text: 'Kalau', start: 0.0, end: 0.45 },
 *       { text: 'kamu', start: 0.45, end: 0.9 },
 *       ...
 *     ]
 *   }
 * ]
 */
export function drawSubtitles(ctx, subtitles, time, width, height, options = {}) {
  const activeCue = subtitles.find((cue) => time >= cue.start && time <= cue.end);
  if (!activeCue || !activeCue.words || activeCue.words.length === 0) return;

  const {
    y = height * 0.74,
    maxWidth = width * 0.82,
    fontSize = 54,
    lineHeight = 70,
    fontFamily = 'Arial, "Segoe UI", sans-serif',
    defaultColor = '#FFFFFF',
    highlightColor = '#FFD43B',
    strokeColor = 'rgba(0, 0, 0, 0.85)',
    strokeWidth = 10,
  } = options;

  ctx.save();
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const spaceWidth = ctx.measureText(' ').width;

  // Bungkus kata menjadi beberapa baris sesuai maxWidth
  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;

  for (const wordObj of activeCue.words) {
    const w = ctx.measureText(wordObj.text).width;
    const extra = currentLine.length > 0 ? spaceWidth : 0;
    if (currentLine.length > 0 && currentLineWidth + extra + w > maxWidth) {
      lines.push({ words: currentLine, width: currentLineWidth });
      currentLine = [{ ...wordObj, width: w }];
      currentLineWidth = w;
    } else {
      currentLine.push({ ...wordObj, width: w });
      currentLineWidth += extra + w;
    }
  }
  if (currentLine.length > 0) {
    lines.push({ words: currentLine, width: currentLineWidth });
  }

  const totalHeight = lines.length * lineHeight;
  let cursorY = y - totalHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    let cursorX = (width - line.width) / 2;

    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i];
      const isActive = time >= w.start && time <= w.end;

      // Sedikit efek pop saat kata aktif
      const scale = isActive ? 1.07 : 1.0;
      const centerX = cursorX + w.width / 2;

      ctx.save();
      ctx.translate(centerX, cursorY);
      ctx.scale(scale, scale);

      // Shadow halus
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Outline hitam
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.strokeText(w.text, -w.width / 2, 0);

      // Isi teks (kuning saat aktif, putih saat tidak aktif)
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = isActive ? highlightColor : defaultColor;
      ctx.fillText(w.text, -w.width / 2, 0);

      ctx.restore();

      cursorX += w.width + spaceWidth;
    }
    cursorY += lineHeight;
  }

  ctx.restore();
}
