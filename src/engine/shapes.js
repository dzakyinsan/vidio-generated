/**
 * Kumpulan komponen vektor 2D flat-illustration yang reusable.
 * Mudah di-extend untuk topik explainer lain (IPA, teknik, sejarah, dll).
 */

export function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawCloud(ctx, x, y, scale = 1, color = '#FFFFFF', alpha = 0.9) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.arc(36, -12, 46, 0, Math.PI * 2);
  ctx.arc(82, -6, 40, 0, Math.PI * 2);
  ctx.arc(112, 6, 30, 0, Math.PI * 2);
  ctx.arc(-28, 10, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawPalmTree(ctx, x, y, scale = 1, sway = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Batang melengkung tipis
  ctx.strokeStyle = '#9C7A54';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10 + sway * 6, -95, 8 + sway * 12, -185);
  ctx.stroke();

  // Daun kelapa
  const topX = 8 + sway * 12;
  const topY = -185;
  const leafAngles = [-2.6, -2.0, -1.2, -0.4, 0.25, 0.85];
  ctx.fillStyle = '#558B47';

  for (const angle of leafAngles) {
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(angle + sway * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(42, -24, 88, 8);
    ctx.quadraticCurveTo(42, -4, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Menggambar sekop (untuk animasi menggali lubang).
 */
export function drawShovel(ctx, x, y, angle = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Gagang kayu
  ctx.fillStyle = '#A67244';
  drawRoundedRect(ctx, -6, -150, 12, 130, 4);
  ctx.fill();

  // Pegangan atas (T-handle)
  ctx.fillStyle = '#8C5C34';
  drawRoundedRect(ctx, -22, -160, 44, 14, 5);
  ctx.fill();

  // Kepala sekop besi
  ctx.fillStyle = '#AEB8C2';
  ctx.beginPath();
  ctx.moveTo(-26, -24);
  ctx.lineTo(26, -24);
  ctx.lineTo(22, 26);
  ctx.quadraticCurveTo(0, 46, -22, 26);
  ctx.closePath();
  ctx.fill();

  // Highlight logam
  ctx.fillStyle = '#CED6DE';
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(-4, -18);
  ctx.lineTo(-6, 22);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Menggambar ikon sisa dapur (apple, carrot, watermelon, leaf, banana).
 */
export function drawScrap(ctx, type, x, y, rotation = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  if (type === 'apple') {
    ctx.fillStyle = '#E04F3E';
    ctx.fillRect(-16, -22, 32, 8);
    ctx.fillRect(-16, 14, 32, 8);
    ctx.fillStyle = '#F7E7CE';
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.quadraticCurveTo(-2, 0, -12, 14);
    ctx.lineTo(12, 14);
    ctx.quadraticCurveTo(2, 0, 12, -14);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'carrot') {
    ctx.fillStyle = '#4CA64C';
    ctx.fillRect(-8, -26, 5, 12);
    ctx.fillRect(0, -28, 5, 14);
    ctx.fillStyle = '#F27D24';
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(12, -14);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'watermelon') {
    ctx.fillStyle = '#3B8C47';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#E84C4C';
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(-7, 7, 2.2, 0, Math.PI * 2);
    ctx.arc(0, 10, 2.2, 0, Math.PI * 2);
    ctx.arc(7, 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'banana') {
    ctx.fillStyle = '#F4CA44';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0.2, Math.PI - 0.2);
    ctx.quadraticCurveTo(0, 8, -21, 4);
    ctx.fill();
  } else {
    // leaf
    ctx.fillStyle = '#6DBB58';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3E8232';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Menggambar karakter bakteri lucu di dalam tangki biogas.
 */
export function drawBacteria(ctx, x, y, color, radius = 20, time = 0, phase = 0) {
  ctx.save();
  ctx.translate(x, y);
  const wobble = Math.sin(time * 6 + phase) * 0.12;
  ctx.rotate(wobble);

  // Kaki / silia kecil di sekeliling tubuh
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + Math.sin(time * 4 + i) * 0.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85);
    ctx.lineTo(Math.cos(a) * (radius + 9), Math.sin(a) * (radius + 9));
    ctx.stroke();
  }

  // Badan
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Mata & mulut lucu
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-6, -3, 4.5, 0, Math.PI * 2);
  ctx.arc(6, -3, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E1E24';
  ctx.beginPath();
  ctx.arc(-5, -3, 2.2, 0, Math.PI * 2);
  ctx.arc(7, -3, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Mulut mengunyah
  const mouthOpen = 2 + Math.abs(Math.sin(time * 9 + phase)) * 4;
  ctx.beginPath();
  ctx.ellipse(0, 7, 4.5, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Menggambar api biru kompor gas (animated).
 */
export function drawBlueFlame(ctx, x, y, scale = 1, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const flicker = 1 + Math.sin(time * 24) * 0.08;
  const offsets = [-24, -12, 0, 12, 24];

  for (let i = 0; i < offsets.length; i++) {
    const ox = offsets[i];
    const h = (38 - Math.abs(ox) * 0.45) * (0.92 + Math.sin(time * 20 + i * 1.4) * 0.14);

    // Cahaya luar
    ctx.fillStyle = 'rgba(56, 152, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(ox, -h * 0.45, 12, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lidah api biru
    ctx.fillStyle = '#2B8CFF';
    ctx.beginPath();
    ctx.moveTo(ox - 8, 0);
    ctx.quadraticCurveTo(ox - 9, -h * 0.6, ox, -h * flicker);
    ctx.quadraticCurveTo(ox + 9, -h * 0.6, ox + 8, 0);
    ctx.closePath();
    ctx.fill();

    // Inti api biru muda
    ctx.fillStyle = '#A8E1FF';
    ctx.beginPath();
    ctx.moveTo(ox - 4, 0);
    ctx.quadraticCurveTo(ox - 4, -h * 0.35, ox, -h * 0.55 * flicker);
    ctx.quadraticCurveTo(ox + 4, -h * 0.35, ox + 4, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Menggambar jalur pipa polyline (lapisan luar + dalam) berdasarkan progress 0..1,
 * plus titik aliran gas opsional.
 */
export function drawAnimatedPipe(
  ctx,
  points,
  drawProgress = 1,
  options = {}
) {
  if (points.length < 2 || drawProgress <= 0) return;

  const {
    outerColor = '#D4A838',
    innerColor = '#F3CF63',
    outerWidth = 22,
    innerWidth = 12,
    flowDots = false,
    time = 0,
    dotColor = '#66CCFF',
  } = options;

  // Hitung panjang total segmen
  const segLengths = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    totalLength += len;
  }

  const targetLen = totalLength * Math.min(1, drawProgress);

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    let acc = 0;
    for (let i = 0; i < segLengths.length; i++) {
      const len = segLengths[i];
      if (acc + len <= targetLen) {
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        acc += len;
      } else {
        const remain = targetLen - acc;
        const ratio = remain / len;
        ctx.lineTo(
          points[i].x + (points[i + 1].x - points[i].x) * ratio,
          points[i].y + (points[i + 1].y - points[i].y) * ratio
        );
        break;
      }
    }
  };

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  tracePath();
  ctx.strokeStyle = outerColor;
  ctx.lineWidth = outerWidth;
  ctx.stroke();

  tracePath();
  ctx.strokeStyle = innerColor;
  ctx.lineWidth = innerWidth;
  ctx.stroke();

  // Titik aliran gas di sepanjang pipa
  if (flowDots && drawProgress >= 0.99) {
    const spacing = 42;
    const offset = (time * 95) % spacing;
    ctx.fillStyle = dotColor;

    for (let d = offset; d < totalLength; d += spacing) {
      let acc = 0;
      for (let i = 0; i < segLengths.length; i++) {
        if (d >= acc && d <= acc + segLengths[i]) {
          const r = (d - acc) / segLengths[i];
          const px = points[i].x + (points[i + 1].x - points[i].x) * r;
          const py = points[i].y + (points[i + 1].y - points[i].y) * r;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        acc += segLengths[i];
      }
    }
  }

  ctx.restore();
}
