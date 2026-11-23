import { applyCamera, evaluateCamera } from '../engine/camera.js';
import {
  clamp,
  createRandom,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  lerpColor,
  progress,
} from '../engine/math.js';
import { drawRoundedRect } from '../engine/shapes.js';

/**
 * Scene Explainer: "Bahaya Ngecas HP di Bawah Bantal atau di Kasur"
 * Durasi total: 26 detik (9:16, 1080x1920)
 *
 * Alur:
 * 0.0 -  3.5s : Hook — Kamar tidur malam, HP dicas lalu diselipkan di bawah bantal
 * 3.5 -  7.5s : Proses ngecas menghasilkan panas alami (listrik mengalir lewat kabel)
 * 7.5 - 12.0s : Efek isolator bantal/kasur — panas terperangkap & suhu melonjak drastis
 * 12.0 - 17.5s : X-Ray zoom ke dalam baterai Li-ion — separator meleleh, thermal runaway!
 * 17.5 - 21.5s : Zoom out — asap keluar dari bantal, risiko kebakaran kasur
 * 21.5 - 26.0s : Solusi aman — taruh HP di meja datar terbuka, panas terbuang, suhu aman
 */

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 960, zoom: 1.0 },
  { time: 3.6, x: 540, y: 960, zoom: 1.0 },
  { time: 4.8, x: 500, y: 1020, zoom: 1.48, ease: easeInOutCubic }, // Zoom ke HP & kabel
  { time: 12.4, x: 500, y: 1020, zoom: 1.48 },
  { time: 13.5, x: 500, y: 1030, zoom: 2.35, ease: easeInOutCubic }, // X-ray zoom ke dalam baterai
  { time: 17.7, x: 500, y: 1030, zoom: 2.35 },
  { time: 18.9, x: 540, y: 960, zoom: 1.05, ease: easeInOutCubic }, // Zoom out lihat asap di kasur
  { time: 22.3, x: 540, y: 960, zoom: 1.05 },
  { time: 23.6, x: 785, y: 950, zoom: 1.38, ease: easeInOutCubic }, // Pan ke nakas (solusi aman)
  { time: 27.5, x: 785, y: 950, zoom: 1.38 },
  { time: 29.0, x: 620, y: 940, zoom: 1.05, ease: easeInOutCubic }, // Zoom out halus untuk CTA Follow
  { time: 31.0, x: 620, y: 940, zoom: 1.05 },
];

// Posisi elemen kamar tidur (world coordinates)
const FLOOR_Y = 1390;
const BED_X = 80;
const BED_W = 640;
const MATTRESS_Y = 1045;
const TABLE_X = 760;
const TABLE_Y = 1030;
const OUTLET_X = 890;
const OUTLET_Y = 890;

const rand = createRandom(777);
const STARS = Array.from({ length: 22 }, () => ({
  x: 135 + rand() * 340,
  y: 350 + rand() * 260,
  r: 1.5 + rand() * 2.5,
  phase: rand() * Math.PI * 2,
}));

const SMOKE_PUFFS = Array.from({ length: 14 }, (_, i) => ({
  seed: i * 1.37,
  ox: (rand() - 0.5) * 140,
  speed: 65 + rand() * 45,
  size: 22 + rand() * 28,
}));

/**
 * Render 1 frame lengkap scene "Ngecas HP di Bawah Bantal" pada waktu `time` (detik).
 */
export function drawChargePillowScene(ctx, time, width, height) {
  const safeTransition = progress(time, 22.5, 23.8, easeInOutCubic);

  // Hitung suhu HP dinamis (°C)
  let tempC = 34;
  if (time < 7.8) {
    tempC = lerp(34, 41, progress(time, 3.8, 7.8));
  } else if (time < 12.6) {
    tempC = lerp(41, 68, progress(time, 7.8, 12.6, easeInOutCubic));
  } else if (time < 18.0) {
    tempC = lerp(68, 92, progress(time, 12.6, 17.2, easeInOutCubic));
  } else if (time < 22.5) {
    tempC = 92 + Math.sin(time * 12) * 2;
  } else {
    tempC = lerp(92, 34, safeTransition);
  }

  const heatFactor = clamp((tempC - 38) / 50, 0, 1);
  const dangerMode = time >= 18.0 && time < 22.6;
  const xrayAlpha =
    progress(time, 12.7, 13.5, easeInOutCubic) -
    progress(time, 17.5, 18.1, easeInOutCubic);

  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Kamar Tidur Malam
  drawBedroomBackground(ctx, time, heatFactor, dangerMode);

  // 2. Kasur, Seprai, dan Meja Nakas
  drawBedAndNightstand(ctx, time, dangerMode);

  // 3. Posisi HP (di kasur -> di bawah bantal -> pindah ke meja nakas saat aman)
  const phoneOnBedX = 485;
  const phoneOnBedY = MATTRESS_Y - 14;
  const phoneOnTableX = TABLE_X + 125;
  const phoneOnTableY = TABLE_Y - 14;

  const phoneX = lerp(phoneOnBedX, phoneOnTableX, safeTransition);
  const phoneY = lerp(phoneOnBedY, phoneOnTableY, safeTransition);

  // 4. Kabel Charger + Aliran Listrik
  drawChargingCable(ctx, time, OUTLET_X, OUTLET_Y, phoneX + 78, phoneY, dangerMode);

  // 5. Smartphone (bisa berubah jadi mode panas / X-ray baterai)
  const phoneSwelling = progress(time, 14.0, 17.0, easeOutCubic) * (1 - safeTransition);
  drawSmartphone(ctx, phoneX, phoneY, time, heatFactor, phoneSwelling);

  // 6. Bantal yang Menutupi HP (muncul turun di t = 1.6s, terangkat/geser saat pindah ke meja)
  const pillowCover =
    progress(time, 1.6, 3.0, easeOutCubic) * (1 - progress(time, 22.4, 23.4, easeInOutCubic));
  const pillowAlpha = xrayAlpha > 0.05 ? lerp(0.92, 0.22, xrayAlpha) : 1;
  drawPillow(ctx, 480, MATTRESS_Y - 46, pillowCover, pillowAlpha, heatFactor, time);

  // 7. Gelombang Panas & Efek Terperangkap di Bawah Bantal (4.0s - 22.5s)
  if (time >= 3.8 && time < 22.6 && xrayAlpha < 0.7) {
    drawTrappedHeatWaves(ctx, phoneX, phoneY - 10, time, heatFactor, pillowCover);
  }

  // 8. X-Ray Diagram Baterai Li-Ion & Thermal Runaway (12.7s - 18.1s)
  if (xrayAlpha > 0.02) {
    drawBatteryXRay(ctx, phoneX, phoneY - 6, time, xrayAlpha);
  }

  // 9. Asap & Api Risiko Kebakaran di Kasur (17.8s - 22.6s)
  if (time >= 17.8 && time < 22.8) {
    const smokeIntensity =
      progress(time, 17.8, 18.7) * (1 - progress(time, 22.2, 22.8));
    drawBedFireAndSmoke(ctx, phoneX, phoneY - 40, time, smokeIntensity);
  }

  // 10. Aliran Udara Dingin & Centang Hijau di Meja Nakas (23.0s - 28.0s)
  if (time >= 22.9) {
    const safeReveal = progress(time, 23.1, 24.1, easeOutBack);
    drawSafeCoolingEffect(ctx, phoneOnTableX, phoneOnTableY, time, safeReveal);
  }

  ctx.restore();

  // 11. Visual Hook Clickbait di awal video (0.0s - 3.5s)
  if (time < 3.6) {
    drawClickbaitHook(ctx, width, height, time);
  }

  // 12. HUD Termometer Suhu di Pojok Kanan Atas (tetap di layar, tidak ikut zoom)
  const hudAlpha = progress(time, 3.8, 4.4) * (1 - progress(time, 27.5, 28.1));
  if (hudAlpha > 0.01) {
    drawTemperatureHUD(ctx, tempC, heatFactor, hudAlpha, width);
  }

  // 13. Badge CTA "+ FOLLOW" di akhir video (27.7s - 31.0s)
  if (time >= 27.6) {
    const ctaPop = progress(time, 27.7, 28.3, easeOutBack);
    drawFollowCTA(ctx, width, height, ctaPop, time);
  }
}

function drawBedroomBackground(ctx, time, heatFactor, dangerMode) {
  // Dinding kamar malam (sedikit kemerahan saat bahaya kebakaran)
  const wallTop = lerpColor('#1E263D', '#3D1D24', dangerMode ? 0.75 : heatFactor * 0.25);
  const wallBot = lerpColor('#2B3654', '#52252A', dangerMode ? 0.75 : heatFactor * 0.25);
  const wallGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  wallGrad.addColorStop(0, wallTop);
  wallGrad.addColorStop(1, wallBot);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(-300, -200, 1800, FLOOR_Y + 250);

  // Jendela malam dengan bulan & bintang
  const wx = 120;
  const wy = 330;
  const ww = 370;
  const wh = 310;
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, wx, wy, ww, wh, 14);
  ctx.fill();

  // Bulan sabit
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(wx + 285, wy + 85, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(wx + 300, wy + 76, 32, 0, Math.PI * 2);
  ctx.fill();

  // Bintang berkelip
  for (const s of STARS) {
    const twinkle = 0.45 + 0.55 * Math.sin(time * 3 + s.phase);
    ctx.fillStyle = `rgba(255, 250, 220, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bingkai jendela
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 14;
  drawRoundedRect(ctx, wx, wy, ww, wh, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  // Stopkontak di dinding kanan
  ctx.fillStyle = '#E2E8F0';
  drawRoundedRect(ctx, OUTLET_X - 28, OUTLET_Y - 34, 56, 68, 10);
  ctx.fill();
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.arc(OUTLET_X, OUTLET_Y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(OUTLET_X - 7, OUTLET_Y, 3.5, 0, Math.PI * 2);
  ctx.arc(OUTLET_X + 7, OUTLET_Y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Lantai kayu kamar
  ctx.fillStyle = '#3B2C26';
  ctx.fillRect(-300, FLOOR_Y, 1800, 700);
  ctx.fillStyle = '#2B201C';
  ctx.fillRect(-300, FLOOR_Y, 1800, 14);
}

function drawBedAndNightstand(ctx, time, dangerMode) {
  // Headboard kayu di kiri kasur
  ctx.fillStyle = '#6B442A';
  drawRoundedRect(ctx, BED_X - 28, MATTRESS_Y - 190, 42, 490, 12);
  ctx.fill();

  // Rangka bawah tempat tidur
  ctx.fillStyle = '#7C5032';
  drawRoundedRect(ctx, BED_X - 10, MATTRESS_Y + 145, BED_W + 20, 75, 10);
  ctx.fill();
  // Kaki tempat tidur
  ctx.fillRect(BED_X + 10, MATTRESS_Y + 215, 34, FLOOR_Y - (MATTRESS_Y + 215));
  ctx.fillRect(BED_X + BED_W - 44, MATTRESS_Y + 215, 34, FLOOR_Y - (MATTRESS_Y + 215));

  // Kasur busa tebal (cross-section tekstur busa isolator)
  ctx.fillStyle = '#E2E8F0';
  drawRoundedRect(ctx, BED_X, MATTRESS_Y, BED_W, 155, 22);
  ctx.fill();

  // Selimut biru gelap di sisi kiri kasur
  ctx.fillStyle = '#3B6496';
  drawRoundedRect(ctx, BED_X - 4, MATTRESS_Y - 10, 310, 175, 22);
  ctx.fill();
  ctx.fillStyle = '#4E7BB0';
  drawRoundedRect(ctx, BED_X - 4, MATTRESS_Y - 10, 310, 34, 16);
  ctx.fill();

  // Noda gosong kecil di kasur saat terbakar
  if (dangerMode) {
    ctx.fillStyle = 'rgba(30, 18, 15, 0.55)';
    ctx.beginPath();
    ctx.ellipse(485, MATTRESS_Y + 8, 95, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Meja Nakas Kayu di sebelah kanan kasur (area aman untuk ngecas)
  ctx.fillStyle = '#8C5B38';
  drawRoundedRect(ctx, TABLE_X, TABLE_Y, 250, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#73482B';
  drawRoundedRect(ctx, TABLE_X + 14, TABLE_Y + 24, 222, 230, 8);
  ctx.fill();
  // Laci nakas
  ctx.fillStyle = '#825333';
  drawRoundedRect(ctx, TABLE_X + 30, TABLE_Y + 46, 190, 78, 6);
  ctx.fill();
  drawRoundedRect(ctx, TABLE_X + 30, TABLE_Y + 140, 190, 78, 6);
  ctx.fill();
  // Pegangan laci
  ctx.fillStyle = '#E2C08D';
  ctx.beginPath();
  ctx.arc(TABLE_X + 125, TABLE_Y + 85, 7, 0, Math.PI * 2);
  ctx.arc(TABLE_X + 125, TABLE_Y + 179, 7, 0, Math.PI * 2);
  ctx.fill();
  // Kaki nakas
  ctx.fillStyle = '#5E3A22';
  ctx.fillRect(TABLE_X + 24, TABLE_Y + 250, 24, FLOOR_Y - (TABLE_Y + 250));
  ctx.fillRect(TABLE_X + 202, TABLE_Y + 250, 24, FLOOR_Y - (TABLE_Y + 250));

  // Label kecil "PERMUKAAN KERAS & TERBUKA" saat solusi aman
  if (time >= 23.2) {
    const a = progress(time, 23.2, 24.0);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#86EFAC';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEJA DATAR & TERBUKA', TABLE_X + 125, TABLE_Y + 295);
    ctx.restore();
  }
}

function drawChargingCable(ctx, time, x1, y1, x2, y2, dangerMode) {
  ctx.save();

  // Kepala adaptor charger di stopkontak
  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, x1 - 22, y1 - 16, 44, 34, 7);
  ctx.fill();

  // Kurva kabel melengkung dari stopkontak ke HP
  const cp1x = x1;
  const cp1y = y1 + 140;
  const cp2x = (x1 + x2) / 2;
  const cp2y = Math.max(y1, y2) + 85;

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1 + 18);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
  ctx.stroke();

  // Titik aliran listrik bergerak dari stopkontak ke HP
  const dotColor = dangerMode ? '#FF5252' : '#38BDF8';
  ctx.fillStyle = dotColor;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const t = (time * 0.55 + i / count) % 1;
    const inv = 1 - t;
    const px =
      inv * inv * inv * x1 +
      3 * inv * inv * t * cp1x +
      3 * inv * t * t * cp2x +
      t * t * t * x2;
    const py =
      inv * inv * inv * (y1 + 18) +
      3 * inv * inv * t * cp1y +
      3 * inv * t * t * cp2y +
      t * t * t * y2;
    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSmartphone(ctx, x, y, time, heatFactor, swelling = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Glow merah panas di sekitar HP
  if (heatFactor > 0.1) {
    const pulse = 1 + Math.sin(time * 9) * 0.12;
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 130 * pulse);
    g.addColorStop(0, `rgba(255, 68, 34, ${0.55 * heatFactor})`);
    g.addColorStop(1, 'rgba(255, 68, 34, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 130 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bodi HP dilihat dari samping-atas (sedikit menggelembung saat baterai kembung)
  const w = 156;
  const h = 24 + swelling * 14;
  const bodyColor = lerpColor('#1E293B', '#991B1B', heatFactor * 0.75);

  ctx.fillStyle = bodyColor;
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 8 + swelling * 4);
  ctx.fill();

  // Layar menyala di atas bodi
  const screenColor = heatFactor > 0.65 ? '#EF4444' : '#38BDF8';
  ctx.fillStyle = screenColor;
  drawRoundedRect(ctx, -w / 2 + 12, -h / 2 + 3, w - 24, 6, 3);
  ctx.fill();

  // Ikon petir charging di atas HP
  if (heatFactor < 0.85) {
    ctx.fillStyle = heatFactor > 0.5 ? '#FDE047' : '#4ADE80';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 0, -h / 2 - 8);
  }

  ctx.restore();
}

function drawPillow(ctx, x, y, coverProgress, alpha, heatFactor, time) {
  if (coverProgress <= 0.01) return;

  ctx.save();
  // Bantal turun dari atas menutupi HP
  const offsetY = lerp(-240, 0, coverProgress);
  ctx.translate(x, y + offsetY);
  ctx.globalAlpha = alpha * Math.min(1, coverProgress * 2);

  // Bayangan bantal
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 42, 165, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bentuk bantal empuk
  const pillowTint = lerpColor('#F1F5F9', '#FDE2D8', heatFactor * 0.5);
  ctx.fillStyle = pillowTint;
  ctx.beginPath();
  ctx.moveTo(-155, 25);
  ctx.quadraticCurveTo(-175, -12, -135, -45);
  ctx.quadraticCurveTo(0, -68, 135, -45);
  ctx.quadraticCurveTo(175, -12, 155, 25);
  ctx.quadraticCurveTo(0, 48, -155, 25);
  ctx.closePath();
  ctx.fill();

  // Jahitan & lipatan bantal
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Label "ISOLATOR PANAS" muncul saat menjelaskan bantal menahan udara (7.9s - 12.4s)
  if (time >= 7.9 && time <= 12.4 && alpha > 0.5) {
    const labelAlpha =
      progress(time, 7.9, 8.5) * (1 - progress(time, 11.8, 12.4));
    ctx.save();
    ctx.globalAlpha = labelAlpha;
    ctx.fillStyle = '#991B1B';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BANTAL = ISOLATOR PANAS', 0, -6);
    ctx.restore();
  }

  ctx.restore();
}

function drawTrappedHeatWaves(ctx, x, y, time, heatFactor, pillowCover) {
  ctx.save();
  ctx.translate(x, y);

  const waveCount = 5;
  for (let i = 0; i < waveCount; i++) {
    const ox = (i - 2) * 34;
    const cycle = (time * 1.4 + i * 0.23) % 1;

    // Jika tertutup bantal, panas naik sedikit lalu memantul balik ke HP!
    let wy;
    if (pillowCover > 0.6) {
      wy = cycle < 0.5 ? lerp(-10, -56, cycle * 2) : lerp(-56, -12, (cycle - 0.5) * 2);
    } else {
      wy = lerp(-10, -110, cycle);
    }

    const alpha = Math.sin(cycle * Math.PI) * (0.4 + heatFactor * 0.6);
    ctx.strokeStyle =
      heatFactor > 0.45
        ? `rgba(255, 80, 40, ${alpha})`
        : `rgba(251, 146, 60, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(ox, wy + 18);
    ctx.quadraticCurveTo(ox + 9, wy + 9, ox, wy);
    ctx.quadraticCurveTo(ox - 9, wy - 9, ox, wy - 18);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * X-Ray penampang dalam Baterai Lithium-ion:
 * Anoda (-) | Separator tipis (meleleh saat overheat!) | Katoda (+)
 * Ketika separator robek -> korsleting internal -> Thermal Runaway!
 */
function drawBatteryXRay(ctx, cx, cy, time, alpha) {
  const meltProgress = progress(time, 14.1, 16.4, easeInOutCubic);
  const runaway = progress(time, 15.9, 17.3, easeOutCubic);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha;

  const bw = 270;
  const bh = 135;

  // Latar kotak X-Ray baterai
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 18);
  ctx.fill();

  ctx.strokeStyle = runaway > 0.2 ? '#EF4444' : '#38BDF8';
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 18);
  ctx.stroke();

  // Kutub baterai kanan
  ctx.fillStyle = '#94A3B8';
  drawRoundedRect(ctx, bw / 2, -24, 14, 48, 4);
  ctx.fill();

  // Sisi Kiri: Anoda (-)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
  drawRoundedRect(ctx, -bw / 2 + 12, -bh / 2 + 14, bw / 2 - 22, bh - 28, 8);
  ctx.fill();

  // Sisi Kanan: Katoda (+)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
  drawRoundedRect(ctx, 10, -bh / 2 + 14, bw / 2 - 22, bh - 28, 8);
  ctx.fill();

  // Separator tipis di tengah (meleleh & bolong di tengah!)
  const gap = meltProgress * 46;
  ctx.strokeStyle = lerpColor('#FDE047', '#EF4444', meltProgress);
  ctx.lineWidth = 6;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(0, -bh / 2 + 14);
  ctx.lineTo(0, -gap / 2);
  ctx.moveTo(0, gap / 2);
  ctx.lineTo(0, bh / 2 - 14);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ion Litium bergerak cepat & kacau saat overheat
  const speed = 1 + meltProgress * 4;
  for (let i = 0; i < 10; i++) {
    const phase = time * speed * 2.5 + i * 1.1;
    const ix = Math.sin(phase) * (runaway > 0.2 ? 95 : 75);
    const iy = Math.cos(phase * 1.3 + i) * 38;
    ctx.fillStyle = runaway > 0.3 ? '#FF6B35' : '#7DD3FC';
    ctx.beginPath();
    ctx.arc(ix, iy, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Percikan Korsleting (Short Circuit) & Thermal Runaway di celah separator
  if (meltProgress > 0.45) {
    const sparkScale = (meltProgress - 0.45) / 0.55;
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 3.5;
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2 + time * 14;
      const r1 = 6;
      const r2 = (22 + Math.sin(time * 25 + s) * 14) * sparkScale;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }

    // Inti ledakan panas
    const core = ctx.createRadialGradient(0, 0, 2, 0, 0, 48 * sparkScale);
    core.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
    core.addColorStop(0.5, 'rgba(255, 100, 30, 0.75)');
    core.addColorStop(1, 'rgba(255, 40, 0, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 48 * sparkScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label edukasi singkat di bawah kotak X-Ray
  ctx.fillStyle = runaway > 0.25 ? '#FCA5A5' : '#E2E8F0';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'center';
  const label =
    runaway > 0.25
      ? 'THERMAL RUNAWAY!'
      : meltProgress > 0.2
      ? 'SEPARATOR MELELEH'
      : 'BATERAI LI-ION';
  ctx.fillText(label, 0, bh / 2 + 24);

  ctx.restore();
}

function drawBedFireAndSmoke(ctx, x, y, time, intensity) {
  if (intensity <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = intensity;

  // Kepulan asap abu-abu pekat naik ke atas
  for (const p of SMOKE_PUFFS) {
    const cycle = (time * 0.42 + p.seed) % 1;
    const sx = p.ox * (0.4 + cycle * 0.9) + Math.sin(time * 2 + p.seed) * 18;
    const sy = -cycle * 340;
    const sr = p.size * (0.6 + cycle * 1.4);
    const a = (1 - cycle) * 0.65;
    ctx.fillStyle = `rgba(100, 116, 139, ${a})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lidah api oranye-merah di bantal
  const flames = [-35, 0, 35];
  flames.forEach((fx, i) => {
    const h = (75 + Math.sin(time * 18 + i * 2) * 18) * intensity;
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(fx - 22, 16);
    ctx.quadraticCurveTo(fx - 20, -h * 0.5, fx, -h);
    ctx.quadraticCurveTo(fx + 20, -h * 0.5, fx + 22, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(fx - 10, 16);
    ctx.quadraticCurveTo(fx - 10, -h * 0.3, fx, -h * 0.55);
    ctx.quadraticCurveTo(fx + 10, -h * 0.3, fx + 10, 16);
    ctx.closePath();
    ctx.fill();
  });

  // Ikon Peringatan Segitiga di atas asap
  const warnScale = 1 + Math.sin(time * 8) * 0.07;
  ctx.save();
  ctx.translate(0, -180);
  ctx.scale(warnScale, warnScale);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(52, 40);
  ctx.lineTo(-52, 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', 0, 28);
  ctx.restore();

  ctx.restore();
}

function drawSafeCoolingEffect(ctx, x, y, time, reveal) {
  ctx.save();
  ctx.translate(x, y);

  // Panah aliran udara dingin keluar menyebar ke udara terbuka
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.8 * Math.min(1, reveal)})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const cycle = (time * 0.9 + (i + 1) * 0.33) % 1;
    const ax = i * 48;
    const ay = lerp(-24, -125, cycle);
    const a = Math.sin(cycle * Math.PI);
    ctx.globalAlpha = a * Math.min(1, reveal);
    ctx.beginPath();
    ctx.moveTo(ax, ay + 24);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax - 9, ay + 10);
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 9, ay + 10);
    ctx.stroke();
  }

  // Lencana Centang Hijau "AMAN"
  ctx.globalAlpha = 1;
  ctx.translate(0, -165);
  ctx.scale(clamp(reveal, 0.01, 1.05), clamp(reveal, 0.01, 1.05));
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(-4, 16);
  ctx.lineTo(20, -14);
  ctx.stroke();

  ctx.restore();
}

function drawTemperatureHUD(ctx, tempC, heatFactor, alpha, width) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const boxW = 240;
  const boxH = 92;
  const x = width - boxW - 44;
  const y = 115;

  // Kartu indikator suhu
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  drawRoundedRect(ctx, x, y, boxW, boxH, 18);
  ctx.fill();

  const accent =
    tempC >= 65 ? '#EF4444' : tempC >= 45 ? '#F97316' : '#38BDF8';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, x, y, boxW, boxH, 18);
  ctx.stroke();

  // Ikon termometer mini
  ctx.fillStyle = accent;
  drawRoundedRect(ctx, x + 28, y + 18, 12, 38, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 34, y + 62, 13, 0, Math.PI * 2);
  ctx.fill();

  // Angka suhu
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 42px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(tempC)}°C`, x + 64, y + 36);

  // Status teks
  ctx.fillStyle = accent;
  ctx.font = 'bold 19px Arial, sans-serif';
  const status =
    tempC >= 70 ? 'BAHAYA OVERHEAT' : tempC >= 45 ? 'MEMANAS' : 'SUHU AMAN';
  ctx.fillText(status, x + 64, y + 69);

  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.28;
  const pulse = 1 + Math.sin(time * 7) * 0.035;
  const scale = clamp(pop, 0.01, 1.08) * pulse;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Pill tombol merah-pink ala TikTok/Reels
  const w = 420;
  const h = 104;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#EF4444';
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 52);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 52);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+ FOLLOW', 0, 2);

  ctx.restore();
}

/**
 * Visual Hook Clickbait di 0.0s - 3.5s ("⚠️ BAHAYA!! JANGAN CAS HP DI BAWAH BANTAL!")
 * agar penonton langsung berhenti scroll dan penasaran.
 */
function drawClickbaitHook(ctx, width, height, time) {
  const enter = progress(time, 0.0, 0.38, easeOutBack);
  const exit = 1 - progress(time, 3.0, 3.5, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;

  // Vignette merah tipis berdenyut di pinggir layar (0 - 2.8s)
  const pulse = 0.55 + 0.45 * Math.sin(time * 10);
  const vig = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.35,
    width / 2,
    height / 2,
    height * 0.72
  );
  vig.addColorStop(0, 'rgba(220, 38, 38, 0)');
  vig.addColorStop(1, `rgba(220, 38, 38, ${0.38 * pulse * exit})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // Posisi banner di area atas yang aman dari UI TikTok/Reels
  const cx = width / 2;
  const cy = height * 0.21;
  // Sedikit getar cepat di 0.4 detik pertama supaya mencolok
  const shakeX = time < 0.5 ? Math.sin(time * 65) * 8 * (1 - time / 0.5) : 0;
  const scale = clamp(enter, 0.01, 1.08);

  ctx.translate(cx + shakeX, cy);
  ctx.scale(scale, scale);

  // 1. Pill merah "⚠ BAHAYA!!"
  const badgeW = 390;
  const badgeH = 88;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.65)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#DC2626';
  drawRoundedRect(ctx, -badgeW / 2, -135, badgeW, badgeH, 20);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, -badgeW / 2, -135, badgeW, badgeH, 20);
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = '900 50px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ BAHAYA!!', 0, -90);

  // 2. Headline utama 2 baris ber-outline tebal
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';

  ctx.font = '900 62px Arial, sans-serif';
  ctx.strokeText('JANGAN CAS HP', 0, 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('JANGAN CAS HP', 0, 4);

  ctx.strokeText('DI BAWAH BANTAL!', 0, 74);
  ctx.fillStyle = '#FFD43B';
  ctx.fillText('DI BAWAH BANTAL!', 0, 74);

  // 3. Subteks pancingan rasa penasaran
  const subAlpha = progress(time, 0.45, 0.85);
  ctx.globalAlpha = exit * subAlpha;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  drawRoundedRect(ctx, -310, 118, 620, 56, 28);
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('Ini yang terjadi di dalam baterainya...', 0, 147);

  ctx.restore();
}
