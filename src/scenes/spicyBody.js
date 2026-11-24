import { applyCamera, evaluateCamera } from '../engine/camera.js';
import {
  clamp,
  easeInOutCubic,
  easeOutBack,
  lerp,
  lerpColor,
  progress,
} from '../engine/math.js';
import { drawRoundedRect } from '../engine/shapes.js';

/**
 * Film Animasi 1-Shot Sinematik (47 Detik):
 * "Apa yang Terjadi pada Tubuh Saat Makan Terlalu Pedas?"
 * (Tenggorokan Panas, Keringat Keluar, Mata Berair, & Solusi Susu!)
 *
 * 1 Karakter & Anatomi X-Ray Bersambung:
 *  - Shot 1 (0.0 -  5.5s) : Karakter makan cabai super pedas -> Shock Hook "PEDAS BUKAN RASA!"
 *  - Shot 2 (5.5 - 15.5s) : Zoom X-Ray Lidah & Tenggorokan -> Kapsaisin menempel di reseptor panas TRPV1 -> tenggorokan membara & sinyal saraf naik ke otak!
 *  - Shot 3 (15.5 - 24.5s): Pan ke Otak (Alarm Panik) & Dahi -> wajah memerah + keringat bercucuran deras!
 *  - Shot 4 (24.5 - 32.5s): Fokus Mata & Hidung -> saraf wajah memicu air mata mengucur & hidung meler!
 *  - Shot 5 (32.5 - 43.0s): Pull-back -> Minum Susu (Protein Kasein menyapu Kapsaisin -> rasa panas padam sejuk!)
 *  - Shot 6 (43.0 - 47.0s): Pull-out lega + CTA "+ FOLLOW"
 */

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 950, zoom: 1.0 },
  { time: 5.2, x: 540, y: 950, zoom: 1.0 },
  { time: 6.6, x: 540, y: 1120, zoom: 1.95, ease: easeInOutCubic }, // Zoom X-Ray ke mulut & tenggorokan (TRPV1)
  { time: 14.8, x: 540, y: 1120, zoom: 1.95 },
  { time: 16.2, x: 540, y: 740, zoom: 1.52, ease: easeInOutCubic }, // Pan naik ke Otak panik & keringat di dahi!
  { time: 23.8, x: 540, y: 740, zoom: 1.52 },
  { time: 25.2, x: 540, y: 890, zoom: 1.68, ease: easeInOutCubic }, // Fokus ke Mata berair & hidung meler!
  { time: 31.8, x: 540, y: 890, zoom: 1.68 },
  { time: 33.4, x: 540, y: 980, zoom: 1.08, ease: easeInOutCubic }, // Pull-back minum susu -> dingin sejuk!
  { time: 42.4, x: 540, y: 980, zoom: 1.08 },
  { time: 43.8, x: 540, y: 940, zoom: 0.96, ease: easeInOutCubic }, // Pull-out lega + CTA Follow
  { time: 47.0, x: 540, y: 940, zoom: 0.96 },
];

function drawAutoPill(ctx, cx, cy, text, font, bgColor, textColor, borderColor = null, h = 64) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(220, ctx.measureText(text).width + 54);
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 18);
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 18);
    ctx.stroke();
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 2);
  ctx.restore();
}

export function drawSpicyBodyScene(ctx, time, width, height) {
  // Faktor panas kepedasan (memuncak 3s - 37.8s, lalu padam sejuk saat minum susu 38s+)
  const heatLevel =
    progress(time, 1.5, 6.0, easeInOutCubic) *
    (1 - progress(time, 38.0, 41.8, easeInOutCubic));
  const coolRelief = progress(time, 38.2, 42.2, easeInOutCubic);

  // 1. Latar gradien dinamis (hangat -> merah membara saat pedas -> biru sejuk saat minum susu!)
  let bgTop = lerpColor('#1E1B2E', '#450A0A', heatLevel);
  let bgBot = lerpColor('#2D2640', '#7F1D1D', heatLevel);
  bgTop = lerpColor(bgTop, '#0C2D48', coolRelief);
  bgBot = lerpColor(bgBot, '#145374', coolRelief);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, bgTop);
  grad.addColorStop(1, bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 2. Karakter Utama (Kepala, Wajah, Leher, Bahu) + Reaksi Tubuh Real-Time!
  drawCharacterAndReactions(ctx, time, heatLevel, coolRelief);

  // 3. Cabai Merah Pedas (0s - 6s) & Gelas Susu Penyelamat (33s - 47s)
  if (time < 6.5) {
    const fade = 1 - progress(time, 5.2, 6.2);
    drawChiliPepper(ctx, 735, 1075, time, fade);
  }
  if (time >= 37.5) {
    const pop = progress(time, 37.8, 38.6, easeOutBack);
    drawMilkGlass(ctx, 755, 1085, time, pop, coolRelief);
  }

  ctx.restore();

  // 4. Overlay Screen-Space (bersih di atas, tidak pernah tertimpa karakter atau subtitle!)
  if (time < 4.5) {
    drawSpicyHook(ctx, time, width, height);
  } else if (time >= 6.2 && time < 15.6) {
    drawTopTag(ctx, width, height, '🔥 KAPSAISIN TIPU RESEPTOR PANAS (TRPV1)', '#DC2626', '#FDE047', time, 6.2, 15.6);
  } else if (time >= 16.0 && time < 24.8) {
    drawTopTag(ctx, width, height, '🧠 OTAK PANIK → KERINGAT MENDINGINKAN TUBUH', '#EA580C', '#FFFFFF', time, 16.0, 24.8);
  } else if (time >= 25.3 && time < 33.2) {
    drawTopTag(ctx, width, height, '💧 MODE BILAS DARURAT → MATA BERAIR & MELER', '#0284C7', '#FFFFFF', time, 25.3, 33.2);
  } else if (time >= 38.0 && time < 43.1) {
    drawTopTag(ctx, width, height, '🥛 PROTEIN KASEIN SUSU MENYAPU KAPSAISIN!', '#16A34A', '#FFFFFF', time, 38.0, 43.1);
  }

  if (time >= 43.2) {
    const pop = progress(time, 43.4, 44.0, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawTopTag(ctx, width, height, text, bg, fg, time, start, end) {
  const a = progress(time, start, start + 0.4) * (1 - progress(time, end - 0.5, end));
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  drawAutoPill(ctx, width / 2, height * 0.21, text, '900 28px Arial, sans-serif', bg, fg, '#FFFFFF', 62);
  ctx.restore();
}

function drawCharacterAndReactions(ctx, time, heatLevel, coolRelief) {
  const cx = 540;
  const headY = 855;

  // --- 1. Bahu & Baju ---
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx - 260, 1420);
  ctx.quadraticCurveTo(cx - 220, 1170, cx - 80, 1150);
  ctx.lineTo(cx + 80, 1150);
  ctx.quadraticCurveTo(cx + 220, 1170, cx + 260, 1420);
  ctx.closePath();
  ctx.fill();

  // --- 2. Leher & Penampang X-Ray Tenggorokan Panas! ---
  const skinBase = lerpColor('#FDBA74', '#F87171', heatLevel * 0.52);
  ctx.fillStyle = skinBase;
  drawRoundedRect(ctx, cx - 68, 1020, 136, 195, 28);
  ctx.fill();

  // X-Ray Saluran Tenggorokan (membara merah-oranye saat kepedasan, biru sejuk saat minum susu!)
  const throatXray = progress(time, 5.8, 6.8) * (1 - progress(time, 42.0, 43.0));
  if (throatXray > 0.02) {
    ctx.save();
    ctx.globalAlpha = throatXray;
    const throatCol = lerpColor('#EF4444', '#38BDF8', coolRelief);
    const tGlow = ctx.createRadialGradient(cx, 1135, 10, cx, 1135, 95);
    tGlow.addColorStop(0, coolRelief > 0.4 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(255, 80, 30, 0.9)');
    tGlow.addColorStop(1, 'rgba(255, 80, 30, 0)');
    ctx.fillStyle = tGlow;
    ctx.beginPath();
    ctx.arc(cx, 1135, 95, 0, Math.PI * 2);
    ctx.fill();

    // Pipa tenggorokan di dalam leher
    ctx.fillStyle = '#1E1B2E';
    drawRoundedRect(ctx, cx - 34, 1035, 68, 185, 24);
    ctx.fill();
    ctx.fillStyle = throatCol;
    ctx.globalAlpha = throatXray * (0.45 + 0.35 * Math.sin(time * 8));
    drawRoundedRect(ctx, cx - 26, 1042, 52, 170, 18);
    ctx.fill();
    ctx.restore();
  }

  // --- 3. Kepala & Telinga ---
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx - 178, headY + 25, 28, 42, -0.1, 0, Math.PI * 2);
  ctx.ellipse(cx + 178, headY + 25, 28, 42, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Wajah bulat ramah
  const faceG = ctx.createRadialGradient(cx - 30, headY - 40, 30, cx, headY, 210);
  faceG.addColorStop(0, lerpColor('#FED7AA', '#FCA5A5', heatLevel * 0.55));
  faceG.addColorStop(1, skinBase);
  ctx.fillStyle = faceG;
  ctx.beginPath();
  ctx.ellipse(cx, headY, 176, 206, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rambut di atas kepala
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(cx, headY - 48, 180, Math.PI * 1.05, Math.PI * 1.95);
  ctx.quadraticCurveTo(cx + 150, headY - 125, cx, headY - 140);
  ctx.quadraticCurveTo(cx - 150, headY - 125, cx - 176, headY - 70);
  ctx.fill();

  // --- 4. X-Ray OTAK (Hipotalamus) berkedip alarm merah saat 15.5s - 24.5s ---
  const brainAlpha =
    progress(time, 15.2, 16.0) * (1 - progress(time, 24.0, 24.8));
  if (brainAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = brainAlpha;
    const pulse = 1 + Math.sin(time * 14) * 0.06;
    ctx.translate(cx, headY - 108);
    ctx.scale(pulse, pulse);

    // Glow alarm merah di otak
    const bg = ctx.createRadialGradient(0, 0, 12, 0, 0, 110);
    bg.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
    bg.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.fill();

    // Siluet otak kiri & kanan
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.ellipse(-34, 0, 48, 36, -0.15, 0, Math.PI * 2);
    ctx.ellipse(34, 0, 48, 36, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9F1239';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Tanda seru alarm di hipotalamus
    ctx.fillStyle = '#FDE047';
    ctx.font = '900 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 2);
    ctx.restore();
  }

  // --- 5. Sinyal Saraf Menyala Naik dari Lidah -> Otak (7s - 24s) ---
  if (time >= 7.0 && time <= 24.5 && coolRelief < 0.3) {
    ctx.save();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 1020);
    ctx.quadraticCurveTo(cx - 80, 910, cx, headY - 95);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulsa listrik kuning naik cepat ke otak
    ctx.fillStyle = '#FEF08A';
    for (let i = 0; i < 4; i++) {
      const c = (time * 1.4 + i * 0.25) % 1;
      const ny = lerp(1020, headY - 95, c);
      const nx = cx - Math.sin(c * Math.PI) * 40;
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- 6. Pipi Memerah saat Kepedasan ---
  ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + heatLevel * 0.45})`;
  ctx.beginPath();
  ctx.ellipse(cx - 98, headY + 46, 36, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 98, headY + 46, 36, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- 7. Mata + Alis + AIR MATA MENGUCUR (24s - 34s) ---
  const tearFactor =
    progress(time, 23.5, 25.2) * (1 - progress(time, 35.5, 37.5));

  for (const side of [-1, 1]) {
    const ex = cx + side * 66;
    const ey = headY - 8;

    // Alis (mengerut kepedasan -> rileks saat minum susu)
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - 26, ey - 38 + heatLevel * 8 * side);
    ctx.lineTo(ex + 26, ey - 38 - heatLevel * 8 * side);
    ctx.stroke();

    // Bola mata
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(ex, ey, 11, 0, Math.PI * 2);
    ctx.fill();

    // Genangan air mata mengkilap & tetesan jatuh di pipi!
    if (tearFactor > 0.05) {
      ctx.save();
      ctx.globalAlpha = tearFactor;
      ctx.fillStyle = '#38BDF8';
      // Genangan di kelopak bawah
      ctx.beginPath();
      ctx.ellipse(ex, ey + 18, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tetesan air mata meluncur ke pipi
      for (let d = 0; d < 2; d++) {
        const cyc = (time * 0.95 + d * 0.5 + (side > 0 ? 0.25 : 0)) % 1;
        const ty = lerp(ey + 22, ey + 145, cyc);
        ctx.beginPath();
        ctx.moveTo(ex + side * 8, ty - 12);
        ctx.quadraticCurveTo(ex + side * 16, ty + 4, ex + side * 8, ty + 10);
        ctx.quadraticCurveTo(ex + side * 0, ty + 4, ex + side * 8, ty - 12);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- 8. Hidung + Tetesan Meler saat Mode Bilas (25s - 34s) ---
  ctx.strokeStyle = '#C27446';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, headY + 12);
  ctx.lineTo(cx - 8, headY + 42);
  ctx.lineTo(cx + 8, headY + 42);
  ctx.stroke();

  if (tearFactor > 0.2) {
    const dripY = headY + 46 + Math.sin(time * 5) * 6;
    ctx.fillStyle = `rgba(125, 211, 252, ${0.85 * tearFactor})`;
    ctx.beginPath();
    ctx.ellipse(cx + 5, dripY + 8, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 9. KERINGAT BERCUCURAN DI DAHI & PELIPIS (16s - 35s) ---
  const sweatFactor =
    progress(time, 15.8, 17.2) * (1 - progress(time, 35.5, 38.0));
  if (sweatFactor > 0.05) {
    ctx.save();
    ctx.globalAlpha = sweatFactor;
    ctx.fillStyle = '#7DD3FC';
    const drops = [-128, -88, 92, 132, -32, 42];
    drops.forEach((ox, idx) => {
      const cyc = (time * 0.85 + idx * 0.21) % 1;
      const sx = cx + ox;
      const sy = lerp(headY - 120, headY + 20, cyc);
      ctx.beginPath();
      ctx.moveTo(sx, sy - 14);
      ctx.quadraticCurveTo(sx + 10, sy + 2, sx, sy + 10);
      ctx.quadraticCurveTo(sx - 10, sy + 2, sx, sy - 14);
      ctx.fill();
    });
    ctx.restore();
  }

  // --- 10. Mulut Terbuka + Lidah + Molekul Kapsaisin & Reseptor TRPV1! ---
  ctx.fillStyle = '#450A0A';
  ctx.beginPath();
  ctx.ellipse(cx, headY + 115, 64, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lidah di dalam mulut
  ctx.fillStyle = lerpColor('#FB7185', '#EF4444', heatLevel * 0.6);
  ctx.beginPath();
  ctx.ellipse(cx, headY + 132, 48, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Molekul Kapsaisin (oranye menyala) menempel di reseptor TRPV1 lidah, lalu disapu Kasein Susu (putih)!
  if (time >= 3.0 && time <= 41.0) {
    const washAway = progress(time, 35.0, 39.2, easeInOutCubic);
    for (let i = 0; i < 6; i++) {
      const mx = cx - 40 + i * 16 + washAway * 45;
      const my = headY + 124 + Math.sin(time * 8 + i) * 4 + washAway * 75;
      ctx.save();
      ctx.globalAlpha = 1 - washAway;
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(mx, my, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bola putih Kasein susu membungkus kapsaisin saat minum susu!
      if (washAway > 0.05 && washAway < 0.95) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawChiliPepper(ctx, x, y, time, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + Math.sin(time * 5) * 8);
  ctx.rotate(-0.4);

  // Tangkai hijau cabai
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.quadraticCurveTo(14, -85, 32, -82);
  ctx.stroke();

  // Badan cabai merah menyala
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(-24, -46);
  ctx.quadraticCurveTo(28, -55, 34, -10);
  ctx.quadraticCurveTo(36, 65, -24, 96);
  ctx.quadraticCurveTo(-48, 45, -24, -46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMilkGlass(ctx, x, y, time, pop, coolRelief) {
  if (pop <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(clamp(pop, 0.01, 1.05), clamp(pop, 0.01, 1.05));
  ctx.rotate(-0.18 * coolRelief);

  // Gelas susu putih segar
  ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-46, -75);
  ctx.lineTo(46, -75);
  ctx.lineTo(36, 75);
  ctx.lineTo(-36, 75);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-42, -38);
  ctx.lineTo(42, -38);
  ctx.lineTo(34, 70);
  ctx.lineTo(-34, 70);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-46, -75);
  ctx.lineTo(46, -75);
  ctx.lineTo(36, 75);
  ctx.lineTo(-36, 75);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#0284C7';
  ctx.font = '900 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUSU', 0, 26);
  ctx.restore();
}

function drawSpicyHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.8, 4.4, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;
  const shakeX = time < 0.45 ? Math.sin(time * 65) * 7 * (1 - time / 0.45) : 0;
  ctx.translate(width / 2 + shakeX, height * 0.21);
  ctx.scale(clamp(enter, 0.01, 1.05), clamp(enter, 0.01, 1.05));

  drawAutoPill(
    ctx,
    0,
    -88,
    '🌶️ PEDAS ITU BUKAN RASA!',
    '900 36px Arial, sans-serif',
    '#DC2626',
    '#FDE047',
    '#FDE047',
    72
  );

  ctx.lineJoin = 'round';
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.font = '900 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('KENAPA MATA BERAIR', 0, 10);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('KENAPA MATA BERAIR', 0, 10);

  ctx.strokeText('& KERINGAT BERCUCURAN?', 0, 72);
  ctx.fillStyle = '#FFD43B';
  ctx.fillText('& KERINGAT BERCUCURAN?', 0, 72);
  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.24;
  const pulse = 1 + Math.sin(time * 7) * 0.035;
  const scale = clamp(pop, 0.01, 1.08) * pulse;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const w = 400;
  const h = 98;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#EF4444';
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 49);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 49);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+ FOLLOW', 0, 2);
  ctx.restore();
}
