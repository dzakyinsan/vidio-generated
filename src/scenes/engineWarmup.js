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
import { drawCloud, drawPalmTree, drawRoundedRect } from '../engine/shapes.js';

/**
 * Film Animasi Pendek 1-Shot Sinematik (48 Detik):
 * "Memanaskan Mesin Lama Tiap Pagi: Perlu atau Boros?"
 *
 * Tanpa slide presentasi — 1 dunia hidup bersambung:
 *  - Shot 1 (0.0 -  8.0s) : Pagi di carport rumah, pengendara nyalakan motor lalu menunggu lama (5-10 menit)
 *  - Shot 2 (8.0 - 17.0s) : Zoom mulus menembus blok mesin -> oli emas di karter dipompa naik melumasi seluruh mesin dalam 30 detik!
 *  - Shot 3 (17.0 - 25.0s): Push-in dinding silinder -> bahaya digeber saat oli belum merata (gesekan & baret!)
 *  - Shot 4 (25.0 - 34.5s): Pull-back sedikit -> efek idle terlalu lama (bensin turun 0 km, kerak karbon, panas tanpa angin)
 *  - Shot 5 (34.5 - 48.0s): Pull-out kembali ke jalan pagi cerah -> melaju santai & angin dingin mendinginkan mesin + "+ FOLLOW"
 */

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 960, zoom: 1.0 },
  { time: 6.2, x: 540, y: 960, zoom: 1.0 },
  { time: 7.4, x: 470, y: 1890, zoom: 1.48, ease: easeInOutCubic }, // Zoom mulus ke dalam mesin (oli di karter)
  { time: 15.2, x: 470, y: 1890, zoom: 1.48 },
  { time: 16.4, x: 470, y: 1790, zoom: 2.05, ease: easeInOutCubic }, // Push-in ke dinding silinder (bahaya digeber!)
  { time: 22.2, x: 470, y: 1790, zoom: 2.05 },
  { time: 23.4, x: 470, y: 1880, zoom: 1.42, ease: easeInOutCubic }, // Pull-back sedikit lihat bensin turun & panas idle
  { time: 29.3, x: 470, y: 1880, zoom: 1.42 },
  { time: 30.8, x: 540, y: 960, zoom: 1.0, ease: easeInOutCubic },   // Pull-out ke pengendara jalan santai pagi hari!
  { time: 41.0, x: 540, y: 960, zoom: 1.0 },
];

const rand = createRandom(5151);
const HOUSES_BG = Array.from({ length: 8 }, (_, i) => ({
  x: i * 320 - 200,
  w: 190 + rand() * 50,
  h: 160 + rand() * 70,
  roof: i % 2 === 0 ? '#C2410C' : '#9A3412',
}));

function drawAutoPill(ctx, cx, cy, text, font, bgColor, textColor, borderColor = null, h = 68) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(220, ctx.measureText(text).width + 58);
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

export function drawEngineWarmupScene(ctx, time, width, height) {
  const insideFactor =
    progress(time, 6.4, 7.5, easeInOutCubic) -
    progress(time, 29.4, 30.6, easeInOutCubic);
  const ridingAway = progress(time, 29.8, 31.2, easeInOutCubic);
  const isRevDanger = time >= 15.6 && time < 22.5;
  const isLongIdle = time >= 22.6 && time < 29.6;

  // Kecepatan piston: cepat sekali saat digeber (15.6-22.5s), pelan/langsam saat idle
  const engineSpeed = isRevDanger ? 14.5 : 5.2;
  const crankAngle = (Math.max(0, time - 6.6) * engineSpeed) % (Math.PI * 4);
  const deg720 = (crankAngle * 180) / Math.PI;

  // Getaran kamera saat mesin digeber kering
  const shakeX = isRevDanger ? Math.sin(time * 92) * 8 : 0;
  const shakeY = isRevDanger ? Math.cos(time * 84) * 6 : 0;

  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(
    ctx,
    { x: camera.x + shakeX, y: camera.y + shakeY, zoom: camera.zoom },
    width,
    height
  );

  // 1. DUNIA LUAR PAGI HARI (Carport Rumah -> Jalan Komplek Pagi Cerah)
  if (insideFactor < 0.98) {
    drawMorningExterior(ctx, time, width, height, ridingAway);
  }

  // 2. DUNIA X-RAY DI DALAM MESIN (y = 1480 .. 2320)
  if (insideFactor > 0.02) {
    ctx.save();
    ctx.globalAlpha = insideFactor;
    drawEngineOilInternal(ctx, time, crankAngle, deg720, isRevDanger, isLongIdle);
    ctx.restore();
  }

  ctx.restore();

  // 3. OVERLAY MINIMALIS (Hook awal + CTA akhir)
  if (time < 3.6) {
    drawMorningHook(ctx, time, width, height);
  }

  if (time >= 37.3) {
    const pop = progress(time, 37.5, 38.1, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

/**
 * DUNIA LUAR: Pagi cerah di carport rumah (0-8s) -> Melaju santai di jalan komplek (35-48s)
 */
function drawMorningExterior(ctx, time, width, height, ridingAway) {
  const groundY = 1250;

  // Langit pagi segar (biru lembut ke oranye fajar hangat)
  const skyGrad = ctx.createLinearGradient(0, -100, 0, groundY);
  skyGrad.addColorStop(0, '#3876A8');
  skyGrad.addColorStop(0.55, '#8CC4E3');
  skyGrad.addColorStop(1, '#FDE6B8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-400, -200, width + 800, groundY + 250);

  // Matahari pagi terbit di kanan atas
  const sunY = lerp(520, 410, ridingAway);
  const sunGlow = ctx.createRadialGradient(860, sunY, 20, 860, sunY, 190);
  sunGlow.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
  sunGlow.addColorStop(1, 'rgba(255, 235, 160, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(860, sunY, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF9DB';
  ctx.beginPath();
  ctx.arc(860, sunY, 64, 0, Math.PI * 2);
  ctx.fill();

  // Awan pagi
  const scrollX = ridingAway > 0.05 ? (time - 29.8) * 240 * ridingAway : 0;
  drawCloud(ctx, ((200 - time * 10 - scrollX * 0.15) % 1500 + 1500) % 1500 - 200, 310, 1.0, '#FFFFFF', 0.85);
  drawCloud(ctx, ((760 - time * 8 - scrollX * 0.1) % 1500 + 1500) % 1500 - 200, 390, 0.85, '#FFFFFF', 0.75);

  // Deretan rumah & pohon komplek parallax saat melaju
  for (const h of HOUSES_BG) {
    const hx = ((h.x - scrollX * 0.45) % 2560 + 2560) % 2560 - 300;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(hx, groundY - h.h, h.w, h.h);
    ctx.fillStyle = h.roof;
    ctx.beginPath();
    ctx.moveTo(hx - 18, groundY - h.h);
    ctx.lineTo(hx + h.w / 2, groundY - h.h - 68);
    ctx.lineTo(hx + h.w + 18, groundY - h.h);
    ctx.closePath();
    ctx.fill();
    // Jendela rumah
    ctx.fillStyle = '#93C5FD';
    ctx.fillRect(hx + 34, groundY - h.h + 36, 46, 46);
    ctx.fillRect(hx + h.w - 80, groundY - h.h + 36, 46, 46);
  }

  // Pohon kelapa / taman komplek
  const treeX = ((140 - scrollX * 0.65) % 1600 + 1600) % 1600 - 200;
  drawPalmTree(ctx, treeX, groundY, 0.95, Math.sin(time * 1.8) * 0.6);

  // Jalan aspal komplek (tampak saat motor keluar dari parkiran rumah)
  ctx.fillStyle = '#334155';
  ctx.fillRect(-400, groundY, width + 800, 800);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-400, groundY, width + 800, 12);

  // Marka jalan bergerak saat motor melaju santai
  ctx.fillStyle = '#F1F5F9';
  const dashOff = (scrollX * 2.0) % 160;
  for (let x = -200 - dashOff; x < width + 400; x += 160) {
    drawRoundedRect(ctx, x, groundY + 95, 72, 13, 6);
    ctx.fill();
  }

  // PARKIRAN / CARPORT RUMAH (di awal film 0-7s, lalu bergeser ke kiri saat motor melaju keluar!)
  const carportShiftX = ridingAway > 0.01 ? -(time - 29.8) * 520 * ridingAway : 0;
  if (carportShiftX > -1400) {
    ctx.save();
    ctx.translate(carportShiftX, 0);
    drawHomeCarport2D(ctx, groundY, width);
    ctx.restore();
  }

  // Motor & Pengendara
  const bikeX = 460;
  const wheelSpin = ridingAway > 0.05 ? (time - 29.8) * 14 : 0;
  const idleVib = ridingAway < 0.1 && time > 1.0 ? Math.sin(time * 42) * 1.8 : 0;
  const rideBounce = ridingAway > 0.05 ? Math.sin(time * 14) * 2.5 : 0;

  // Asap knalpot tebal saat idle lama di carport (1s - 8s), tipis saat melaju santai (35s+)
  if (time > 1.0) {
    const puffCount = ridingAway > 0.2 ? 4 : 8;
    for (let i = 0; i < puffCount; i++) {
      const c = (time * (ridingAway > 0.2 ? 1.5 : 0.7) + i / puffCount) % 1;
      const ex = bikeX - 140 - c * (ridingAway > 0.2 ? 170 : 120);
      const ey = groundY - 56 - c * (ridingAway > 0.2 ? 22 : 95);
      ctx.fillStyle = `rgba(203, 213, 225, ${(1 - c) * (ridingAway > 0.2 ? 0.35 : 0.65)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 11 + c * 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Aliran angin pagi sejuk melintasi sirip mesin saat melaju santai (36s - 48s)
  if (ridingAway > 0.3) {
    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * ridingAway})`;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const cyc = (time * 1.4 + i * 0.27) % 1;
      const wx = lerp(bikeX + 260, bikeX - 180, cyc);
      const wy = groundY - 125 + i * 24;
      ctx.globalAlpha = Math.sin(cyc * Math.PI) * ridingAway;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 65, wy);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMorningMotorcycle(ctx, bikeX + idleVib, groundY - 10 + rideBounce, wheelSpin);

  // Di 0-8s: Pengendara berdiri santai di samping motor sambil lihat jam/HP menunggu 10 menit!
  // Di 35-48s: Pengendara duduk di atas motor melaju santai!
  if (ridingAway < 0.3) {
    drawWaitingOwner(ctx, bikeX + 195, groundY - 8, time);
    // Stopwatch mengambang di atas motor berputar cepat 00:00 -> 10:00!
    if (time >= 1.2 && time < 6.4) {
      const mins = Math.min(10, Math.floor(lerp(0, 10.5, progress(time, 1.2, 5.8))));
      const secs = Math.floor(((time * 18) % 60));
      const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      drawAutoPill(
        ctx,
        bikeX,
        groundY - 295,
        `⏱ ${str}  (IDLE DI TEMPAT)`,
        '900 28px Consolas, monospace',
        'rgba(15, 23, 42, 0.88)',
        mins >= 5 ? '#FCA5A5' : '#FDE047',
        mins >= 5 ? '#EF4444' : '#F59E0B',
        58
      );
    }
  } else {
    drawSittingRider(ctx, bikeX - 24, groundY - 185 + rideBounce);
    if (time >= 31.0 && time < 37.4) {
      drawAutoPill(
        ctx,
        bikeX,
        groundY - 315,
        '✓ Cukup 30–60 detik, lalu jalan santai!',
        '900 27px Arial, sans-serif',
        'rgba(22, 163, 74, 0.9)',
        '#FFFFFF',
        '#86EFAC',
        58
      );
    }
  }
}

function drawHomeCarport2D(ctx, groundY, width) {
  // Dinding rumah di belakang parkiran
  ctx.fillStyle = '#F3EAD8';
  ctx.fillRect(-80, 650, width + 160, groundY - 650);

  // Lis batu alam abu-abu bagian bawah dinding rumah
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-80, groundY - 120, width + 160, 120);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  for (let x = -60; x < width + 120; x += 72) {
    ctx.strokeRect(x, groundY - 120, 72, 60);
    ctx.strokeRect(x + 36, groundY - 60, 72, 60);
  }

  // Pintu kayu rumah (sisi kiri)
  ctx.fillStyle = '#5C3A21';
  drawRoundedRect(ctx, 74, groundY - 365, 168, 365, 8);
  ctx.fill();
  ctx.fillStyle = '#8B5A36';
  drawRoundedRect(ctx, 88, groundY - 350, 140, 350, 6);
  ctx.fill();
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(204, groundY - 175, 8, 0, Math.PI * 2);
  ctx.fill();

  // Jendela rumah dengan tirai & kaca biru pagi (sisi kanan)
  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, 735, groundY - 365, 250, 185, 8);
  ctx.fill();
  ctx.fillStyle = '#BAE6FD';
  ctx.fillRect(750, groundY - 350, 105, 155);
  ctx.fillRect(865, groundY - 350, 105, 155);

  // Rak sepatu & pot tanaman hias di teras parkiran
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.moveTo(855, groundY);
  ctx.lineTo(935, groundY);
  ctx.lineTo(948, groundY - 72);
  ctx.lineTo(842, groundY - 72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2F855A';
  ctx.beginPath();
  ctx.arc(895, groundY - 108, 42, 0, Math.PI * 2);
  ctx.arc(862, groundY - 92, 30, 0, Math.PI * 2);
  ctx.arc(928, groundY - 92, 30, 0, Math.PI * 2);
  ctx.fill();

  // Lantai paving / keramik carport rumah
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-100, groundY, width + 200, 190);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  for (let x = -80; x < width + 180; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 36, groundY + 190);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-100, groundY + 62);
  ctx.lineTo(width + 100, groundY + 62);
  ctx.moveTo(-100, groundY + 126);
  ctx.lineTo(width + 100, groundY + 126);
  ctx.stroke();

  // Atap & Tiang Kanopi Carport (besi gelap + polikarbonat transparan)
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(16, 610, 28, groundY - 610);
  ctx.fillRect(width - 44, 610, 28, groundY - 610);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fillRect(-60, 565, width + 120, 48);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.fillRect(-60, 540, width + 120, 28);

  // Lampu teras hangat di bawah kanopi
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(width / 2, 622, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaitingOwner(ctx, x, footY, time) {
  ctx.save();
  ctx.translate(x, footY);
  // Kaki
  ctx.fillStyle = '#1E293B';
  drawRoundedRect(ctx, -20, -125, 18, 125, 8);
  ctx.fill();
  drawRoundedRect(ctx, 4, -125, 18, 125, 8);
  ctx.fill();
  // Jaket pagi
  ctx.fillStyle = '#0F766E';
  drawRoundedRect(ctx, -28, -242, 56, 124, 16);
  ctx.fill();
  // Tangan pegang cangkir kopi / HP
  ctx.strokeStyle = '#0F766E';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, -210);
  ctx.lineTo(-48, -172);
  ctx.stroke();
  // Cangkir kopi dengan uap
  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, -64, -184, 24, 26, 4);
  ctx.fill();
  // Kepala
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(0, -276, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(0, -284, 29, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawSittingRider(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0F766E';
  drawRoundedRect(ctx, -28, -82, 56, 104, 16);
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(4, -120, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, 8, -132, 30, 18, 6);
  ctx.fill();
  ctx.restore();
}

function drawMorningMotorcycle(ctx, x, groundY, wheelSpin) {
  ctx.save();
  ctx.translate(x, groundY);
  for (const wx of [-98, 108]) {
    ctx.save();
    ctx.translate(wx, -48);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(wheelSpin);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-21, 0);
      ctx.lineTo(21, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#64748B';
  drawRoundedRect(ctx, -135, -68, 110, 22, 10);
  ctx.fill();
  ctx.fillStyle = '#475569';
  drawRoundedRect(ctx, -22, -108, 72, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  drawRoundedRect(ctx, -118, -142, 236, 56, 20);
  ctx.fill();
  ctx.fillStyle = '#DC2626';
  drawRoundedRect(ctx, 16, -174, 84, 50, 18);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(108, -48);
  ctx.lineTo(86, -202);
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(118, -172, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * DUNIA X-RAY DI DALAM MESIN (y = 1480 .. 2320):
 * - Sirkulasi Oli Emas dari karter bawah naik melumasi dinding silinder & klep dalam 30 detik
 * - Gesekan kering / baret merah saat digeber (17.5s - 24.8s)
 * - Indikator bensin turun + kerak karbon + suhu panas saat idle lama (25.0s - 34.6s)
 */
function drawEngineOilInternal(ctx, time, crankAngle, deg720, isRevDanger, isLongIdle) {
  const cx = 470;
  const cylTopY = 1660;
  const cylBotY = 1995;
  const crankY = 2150;
  const crankRadius = 86;
  const rodLength = 230;
  const cylInnerHalfW = 124;

  // Latar X-Ray metalik gelap (memerah saat digeber kering atau panas idle)
  const warnGlow = isRevDanger ? 0.8 : isLongIdle ? 0.45 : 0;
  const bgGrad = ctx.createLinearGradient(0, 1300, 0, 2450);
  bgGrad.addColorStop(0, lerpColor('#0A101B', '#281014', warnGlow));
  bgGrad.addColorStop(1, lerpColor('#141E30', '#3A151B', warnGlow));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-150, 1280, 1400, 1300);

  // Kinematika piston
  const pinX = cx + Math.sin(crankAngle) * crankRadius;
  const pinY = crankY - Math.cos(crankAngle) * crankRadius;
  const dx = pinX - cx;
  const pistonPinY = pinY - Math.sqrt(Math.max(1, rodLength * rodLength - dx * dx));
  const pistonTopY = pistonPinY - 58;

  // Progress sirkulasi oli naik dari karter (7.4s -> 13.8s = simulasi 0 -> 30 detik!)
  const oilRise = progress(time, 7.4, 13.8, easeOutCubic);
  const idleCarbon = progress(time, 23.5, 29.2, easeOutCubic);

  // 1. Blok silinder & sirip pendingin (memerah lembut saat panas idle tanpa angin)
  const finColor = isLongIdle ? lerpColor('#475569', '#B91C1C', progress(time, 23.0, 29.0)) : '#475569';
  ctx.fillStyle = finColor;
  for (let y = cylTopY + 24; y <= cylBotY - 24; y += 34) {
    drawRoundedRect(ctx, cx - cylInnerHalfW - 82, y, 54, 14, 5);
    ctx.fill();
    drawRoundedRect(ctx, cx + cylInnerHalfW + 28, y, 54, 14, 5);
    ctx.fill();
  }

  // Karter / Bak Oli di bawah crankshaft
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(cx, crankY, 168, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 9;
  ctx.stroke();

  // Genangan Oli Emas di dasar karter!
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, crankY, 162, 0, Math.PI * 2);
  ctx.clip();
  const oilGrad = ctx.createLinearGradient(0, crankY + 60, 0, crankY + 165);
  oilGrad.addColorStop(0, '#F59E0B');
  oilGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = oilGrad;
  ctx.fillRect(cx - 170, crankY + 68, 340, 110);
  ctx.restore();

  // Dinding silinder baja
  ctx.fillStyle = '#64748B';
  ctx.fillRect(cx - cylInnerHalfW - 30, cylTopY - 20, 30, cylBotY - cylTopY + 50);
  ctx.fillRect(cx + cylInnerHalfW, cylTopY - 20, 30, cylBotY - cylTopY + 50);
  ctx.fillStyle = '#475569';
  drawRoundedRect(ctx, cx - cylInnerHalfW - 50, cylTopY - 86, (cylInnerHalfW + 50) * 2, 88, 16);
  ctx.fill();

  // Bagian dalam silinder
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(cx - cylInnerHalfW, cylTopY, cylInnerHalfW * 2, cylBotY - cylTopY + 30);

  // Saluran Oli Naik di Dinding Kiri & Kanan (Oli emas membasahi dinding silinder!)
  if (oilRise > 0.02 && !isRevDanger) {
    const oilFilmH = (cylBotY - cylTopY + 20) * oilRise;
    const oilTop = cylBotY + 20 - oilFilmH;

    // Lapisan tipis oli emas berkilau di dinding kiri & kanan silinder
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.fillRect(cx - cylInnerHalfW, oilTop, 8, oilFilmH);
    ctx.fillRect(cx + cylInnerHalfW - 8, oilTop, 8, oilFilmH);

    // Tetesan oli dipompa naik dari karter ke atas
    ctx.fillStyle = '#FBBF24';
    for (let i = 0; i < 6; i++) {
      const cyc = (time * 0.9 + i * 0.22) % 1;
      const oy = lerp(crankY + 80, oilTop + 10, cyc);
      ctx.beginPath();
      ctx.arc(cx - cylInnerHalfW - 15, oy, 5, 0, Math.PI * 2);
      ctx.arc(cx + cylInnerHalfW + 15, oy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // EFEK DIGEBER KERING (17.5s - 24.8s): Percikan gesekan & garis baret merah di dinding silinder!
  if (isRevDanger) {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 5;
    for (let s = 0; s < 4; s++) {
      const sy = cylTopY + 75 + s * 42;
      ctx.beginPath();
      ctx.moveTo(cx - cylInnerHalfW + 2, sy);
      ctx.lineTo(cx - cylInnerHalfW + 2, sy + 24);
      ctx.moveTo(cx + cylInnerHalfW - 2, sy + 10);
      ctx.lineTo(cx + cylInnerHalfW - 2, sy + 34);
      ctx.stroke();
    }
    // Percikan api gesekan di ring piston
    ctx.fillStyle = '#FEF08A';
    for (let p = 0; p < 6; p++) {
      const sx = p % 2 === 0 ? cx - cylInnerHalfW + 6 : cx + cylInnerHalfW - 6;
      const sy = pistonTopY + 20 + Math.sin(time * 40 + p * 2) * 18;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ruang bakar menyala lembut tiap siklus
  const chamberH = Math.max(16, pistonTopY - cylTopY);
  if (deg720 >= 360 && deg720 < 520) {
    const exp = (deg720 - 360) / 160;
    ctx.fillStyle = `rgba(251, 146, 60, ${(1 - exp) * 0.72})`;
    ctx.fillRect(cx - cylInnerHalfW + 6, cylTopY, (cylInnerHalfW - 6) * 2, chamberH);
  }

  // Crankshaft & Stang Piston
  ctx.save();
  ctx.translate(cx, crankY);
  ctx.rotate(crankAngle);
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  ctx.arc(0, 0, crankRadius + 28, 0.25, Math.PI - 0.25);
  ctx.lineTo(-26, -crankRadius - 8);
  ctx.arc(0, -crankRadius, 26, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 24;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pinX, pinY);
  ctx.lineTo(cx, pistonPinY);
  ctx.stroke();

  // Kepala Piston + Ring + Kerak Karbon (saat idle lama)
  const pGrad = ctx.createLinearGradient(cx - 116, pistonTopY, cx + 116, pistonTopY);
  pGrad.addColorStop(0, '#475569');
  pGrad.addColorStop(0.3, '#E2E8F0');
  pGrad.addColorStop(1, '#334155');
  ctx.fillStyle = pGrad;
  drawRoundedRect(ctx, cx - 116, pistonTopY, 232, 118, 10);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(cx - 116, pistonTopY + 18, 232, 6);
  ctx.fillRect(cx - 116, pistonTopY + 32, 232, 6);
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.arc(cx, pistonPinY, 15, 0, Math.PI * 2);
  ctx.fill();

  if (idleCarbon > 0.02) {
    ctx.fillStyle = `rgba(12, 12, 16, ${0.88 * idleCarbon})`;
    drawRoundedRect(ctx, cx - 112, pistonTopY - 4, 224, 15 * idleCarbon + 4, 6);
    ctx.fill();
  }

  // Indikator Diegetik Mini di samping mesin (tanpa judul presentasi!)
  if (time >= 7.2 && time < 15.5) {
    const sec = Math.min(30, Math.round(oilRise * 30));
    drawAutoPill(
      ctx,
      cx,
      cylTopY - 125,
      sec >= 30 ? '✓ 30 DETIK: OLI SUDAH MERATA!' : `⛽ POMPA OLI NAIK... (${sec} dtk)`,
      '900 22px Consolas, monospace',
      'rgba(15, 23, 42, 0.88)',
      sec >= 30 ? '#4ADE80' : '#FBBF24',
      sec >= 30 ? '#22C55E' : '#F59E0B',
      48
    );
  } else if (isRevDanger) {
    drawAutoPill(
      ctx,
      cx,
      cylTopY - 115,
      '❌ JANGAN DIGEBER! DINDING SILINDER BARET',
      '900 20px Arial, sans-serif',
      'rgba(220, 38, 38, 0.92)',
      '#FFFFFF',
      '#FDE047',
      46
    );
  } else if (isLongIdle) {
    const fuelLeft = Math.round(lerp(100, 74, progress(time, 22.8, 29.2)));
    drawAutoPill(
      ctx,
      cx,
      cylTopY - 125,
      `⛽ BENSIN ${fuelLeft}% (0.0 KM) • KERAK & PANAS ↑`,
      '900 21px Consolas, monospace',
      'rgba(127, 29, 29, 0.9)',
      '#FCA5A5',
      '#EF4444',
      48
    );
  }
}

function drawMorningHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.0, 3.55, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;
  const shakeX = time < 0.45 ? Math.sin(time * 65) * 7 * (1 - time / 0.45) : 0;
  ctx.translate(width / 2 + shakeX, height * 0.21);
  ctx.scale(clamp(enter, 0.01, 1.05), clamp(enter, 0.01, 1.05));

  drawAutoPill(
    ctx,
    0,
    -84,
    '⚠ PERLU ATAU BOROS BENSIN?!',
    '900 36px Arial, sans-serif',
    '#DC2626',
    '#FDE047',
    '#FDE047',
    72
  );

  ctx.lineJoin = 'round';
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.font = '900 50px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('PANASIN MESIN LAMA TIAP PAGI?', 0, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('PANASIN MESIN LAMA TIAP PAGI?', 0, 18);
  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.3;
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
