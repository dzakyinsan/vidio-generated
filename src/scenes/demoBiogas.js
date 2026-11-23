import { applyCamera, evaluateCamera } from '../engine/camera.js';
import {
  clamp,
  createRandom,
  easeInOutCubic,
  easeInQuad,
  easeOutBack,
  easeOutCubic,
  lerp,
  progress,
} from '../engine/math.js';
import {
  drawAnimatedPipe,
  drawBacteria,
  drawBlueFlame,
  drawRoundedRect,
  drawScrap,
  drawShovel,
} from '../engine/shapes.js';
import { drawWorld, GROUND_Y, PIT_H, PIT_W, PIT_X, STOVE_X, STOVE_Y } from './world.js';

/**
 * Keyframe kamera untuk seluruh cerita (disinkronkan dengan voiceover.mp3 22 detik).
 */
const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 960, zoom: 1.0 },
  { time: 9.2, x: 540, y: 960, zoom: 1.0 },
  { time: 10.4, x: 540, y: 1160, zoom: 1.52, ease: easeInOutCubic }, // Zoom ke dalam tangki (bakteri)
  { time: 13.2, x: 540, y: 1160, zoom: 1.52 },
  { time: 14.8, x: 1020, y: 840, zoom: 1.48, ease: easeInOutCubic }, // Pan ke kompor dapur
  { time: 17.3, x: 1020, y: 840, zoom: 1.48 },
  { time: 19.1, x: 500, y: 920, zoom: 0.72, ease: easeInOutCubic }, // Zoom out lihat seluruh sistem
  { time: 22.0, x: 500, y: 920, zoom: 0.72 },
];

// Data sisa dapur yang jatuh ke lubang (2.5s - 5.5s)
const SCRAPS = [
  { type: 'apple', start: 2.55, endX: 430, rot: -0.4 },
  { type: 'banana', start: 2.95, endX: 505, rot: 0.3 },
  { type: 'watermelon', start: 3.35, endX: 615, rot: -0.2 },
  { type: 'carrot', start: 3.75, endX: 560, rot: 0.7 },
  { type: 'leaf', start: 4.15, endX: 465, rot: -0.6 },
  { type: 'leaf', start: 4.55, endX: 650, rot: 0.4 },
];

// Data garis hujan deterministik
const rainRand = createRandom(999);
const RAIN_DROPS = Array.from({ length: 90 }, () => ({
  x: -400 + rainRand() * 2200,
  y: rainRand() * 1920,
  len: 32 + rainRand() * 35,
  speed: 1200 + rainRand() * 400,
}));

/**
 * Render satu frame penuh dari demo Biogas Explainer pada waktu `time` (detik).
 */
export function drawBiogasDemo(ctx, time, width, height) {
  // Faktor cuaca & transisi hari
  const rainFactor =
    progress(time, 5.7, 6.4, easeInOutCubic) -
    progress(time, 8.7, 9.3, easeInOutCubic);
  const sunsetFactor = progress(time, 17.4, 19.8, easeInOutCubic);
  const tomatoGrowth = progress(time, 17.6, 20.5, easeOutCubic);

  // Terapkan kamera 2D
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);
  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Dunia
  drawWorld(ctx, time, { rainFactor, sunsetFactor, tomatoGrowth });

  // 2. Animasi Gali Lubang (0s -> 2.5s)
  const digDepth = progress(time, 0.15, 2.25, easeOutCubic);
  const currentPitH = PIT_H * digDepth;

  // Gundukan tanah hasil galian di sebelah kiri lubang
  if (digDepth > 0.05) {
    const moundScale = digDepth;
    ctx.fillStyle = '#733D22';
    ctx.beginPath();
    ctx.moveTo(PIT_X - 240, GROUND_Y);
    ctx.quadraticCurveTo(PIT_X - 135, GROUND_Y - 105 * moundScale, PIT_X - 30, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  // Lubang galian gelap
  if (currentPitH > 2) {
    ctx.fillStyle = '#24140D';
    ctx.fillRect(PIT_X, GROUND_Y, PIT_W, currentPitH);
    // Perspektif bibir lubang atas
    ctx.fillStyle = '#3B2216';
    ctx.beginPath();
    ctx.moveTo(PIT_X - 14, GROUND_Y);
    ctx.lineTo(PIT_X + PIT_W + 14, GROUND_Y);
    ctx.lineTo(PIT_X + PIT_W, GROUND_Y + 26);
    ctx.lineTo(PIT_X, GROUND_Y + 26);
    ctx.closePath();
    ctx.fill();
  }

  // Sekop bergerak naik-turun saat menggali (0.05s - 2.45s)
  if (time >= 0.05 && time <= 2.45) {
    const scoopCycle = Math.sin(time * 10);
    const shovelFade = 1 - progress(time, 2.15, 2.45);
    ctx.save();
    ctx.globalAlpha = shovelFade;
    drawShovel(
      ctx,
      PIT_X + PIT_W * 0.5 + scoopCycle * 45,
      GROUND_Y + currentPitH * 0.65 - Math.abs(scoopCycle) * 40,
      -0.35 + scoopCycle * 0.45,
      1.05
    );
    ctx.restore();
  }

  // 3. Sampah Dapur & Banjir Air Hujan (2.5s - 9.2s)
  if (time >= 2.5 && time < 9.2) {
    const floodLevel = progress(time, 6.0, 8.2, easeOutCubic);
    const waterHeight = PIT_H * 0.88 * floodLevel;
    const waterTopY = GROUND_Y + PIT_H - waterHeight;

    // Air banjir keruh
    if (waterHeight > 1) {
      ctx.fillStyle = 'rgba(104, 114, 96, 0.88)';
      ctx.fillRect(PIT_X, waterTopY, PIT_W, waterHeight);
    }

    // Sampah jatuh lalu mengapung jika banjir
    for (const s of SCRAPS) {
      if (time < s.start) continue;
      const fallT = progress(time, s.start, s.start + 0.65, easeInQuad);
      const bottomY = GROUND_Y + PIT_H - 28;
      const baseY = lerp(GROUND_Y - 260, bottomY, fallT);
      const y = floodLevel > 0.05 ? Math.min(baseY, waterTopY + 12 + Math.sin(time * 4 + s.endX) * 4) : baseY;
      drawScrap(ctx, s.type, s.endX, y, s.rot + (1 - fallT) * 2.5, 1.05);
    }

    // Garis bau busuk saat banjir
    if (floodLevel > 0.4) {
      const stinkAlpha = progress(time, 6.8, 7.6);
      ctx.save();
      ctx.globalAlpha = stinkAlpha * 0.75;
      ctx.strokeStyle = '#92C955';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const sx = PIT_X + 95 + i * 115;
        ctx.beginPath();
        for (let dy = 0; dy <= 120; dy += 10) {
          const wx = sx + Math.sin(dy * 0.08 - time * 6 + i) * 14;
          const wy = GROUND_Y - 10 - dy;
          if (dy === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 4. Tangki Biogas Tertutup, Bakteri & Gas Metana (t >= 9.1s)
  if (time >= 9.1) {
    const tankPop = progress(time, 9.1, 9.75, easeOutBack);
    drawBiogasTank(ctx, time, tankPop);
  }

  // 5. Pipa Gas ke Kompor Dapur & Api Biru (t >= 13.4s)
  if (time >= 13.4) {
    const pipeProgress = progress(time, 13.4, 14.9, easeInOutCubic);
    const gasFlowing = time >= 15.1;

    const gasPipePoints = [
      { x: PIT_X + PIT_W * 0.5 + 32, y: GROUND_Y + 32 },
      { x: PIT_X + PIT_W * 0.5 + 32, y: GROUND_Y - 12 },
      { x: STOVE_X - 65, y: GROUND_Y - 12 },
      { x: STOVE_X - 65, y: STOVE_Y + 8 },
      { x: STOVE_X - 18, y: STOVE_Y + 8 },
    ];

    drawAnimatedPipe(ctx, gasPipePoints, pipeProgress, {
      flowDots: gasFlowing,
      time,
    });

    // Keran merah
    if (pipeProgress > 0.92) {
      const valveAngle = progress(time, 14.9, 15.25, easeOutCubic) * (Math.PI / 2);
      ctx.save();
      ctx.translate(STOVE_X - 65, STOVE_Y + 8);
      ctx.rotate(valveAngle);
      ctx.fillStyle = '#D93829';
      drawRoundedRect(ctx, -20, -6, 40, 12, 5);
      ctx.fill();
      ctx.restore();
    }

    // Api biru kompor + wajan memasak
    if (time >= 15.3) {
      const flameScale = progress(time, 15.3, 15.7, easeOutBack);
      drawBlueFlame(ctx, STOVE_X - 10, STOVE_Y - 30, flameScale, time);

      // Wajan muncul di atas api
      const panAlpha = progress(time, 16.0, 16.4, easeOutCubic);
      if (panAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = panAlpha;
        ctx.fillStyle = '#22262B';
        drawRoundedRect(ctx, STOVE_X - 54, STOVE_Y - 68, 88, 18, 6);
        ctx.fill();
        ctx.fillRect(STOVE_X + 34, STOVE_Y - 64, 48, 8);
        // Uap masakan
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          const uapY = (time * 40 + i * 24) % 65;
          ctx.beginPath();
          ctx.arc(STOVE_X - 28 + i * 18, STOVE_Y - 78 - uapY, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // 6. Efek Hujan (overlay di dalam world)
  if (rainFactor > 0.02) {
    ctx.save();
    ctx.strokeStyle = `rgba(210, 232, 255, ${0.55 * rainFactor})`;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (const d of RAIN_DROPS) {
      const y = ((d.y + time * d.speed) % 2100) - 200;
      const x = d.x - y * 0.14;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * 0.14, y + d.len);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawBiogasTank(ctx, time, popScale) {
  const cx = PIT_X + PIT_W / 2;
  const cy = GROUND_Y + PIT_H / 2 + 12;
  const tankW = 350;
  const tankH = 345;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(clamp(popScale, 0.01, 1.05), clamp(popScale, 0.01, 1.05));

  // Dinding luar tangki abu-abu
  ctx.fillStyle = '#9AA4AD';
  drawRoundedRect(ctx, -tankW / 2, -tankH / 2, tankW, tankH, 74);
  ctx.fill();

  // Leher tangki di atas
  ctx.fillStyle = '#8B959E';
  ctx.fillRect(-26, -tankH / 2 - 42, 52, 48);
  ctx.fillStyle = '#6C757D';
  drawRoundedRect(ctx, -36, -tankH / 2 - 50, 72, 14, 5);
  ctx.fill();

  // Bagian dalam tangki (clipping agar cairan & gelembung rapi di dalam)
  ctx.save();
  drawRoundedRect(ctx, -tankW / 2 + 16, -tankH / 2 + 16, tankW - 32, tankH - 32, 60);
  ctx.clip();

  // Ruang gelap (berubah sedikit keunguan saat gas metana menumpuk)
  const gasBuild = progress(time, 11.2, 13.4);
  ctx.fillStyle = `rgb(${Math.round(18 + gasBuild * 48)}, ${Math.round(18 + gasBuild * 42)}, ${Math.round(24 + gasBuild * 68)})`;
  ctx.fillRect(-tankW / 2, -tankH / 2, tankW, tankH);

  // Cairan slurry organik di bagian bawah
  ctx.fillStyle = '#7C5432';
  ctx.beginPath();
  ctx.moveTo(-tankW / 2, 10);
  for (let x = -tankW / 2; x <= tankW / 2; x += 20) {
    const wave = Math.sin(x * 0.04 + time * 4) * 5;
    ctx.lineTo(x, 10 + wave);
  }
  ctx.lineTo(tankW / 2, tankH / 2);
  ctx.lineTo(-tankW / 2, tankH / 2);
  ctx.closePath();
  ctx.fill();

  // Bakteri anaerob lucu makan sisa organik
  const bacteriaPop = progress(time, 10.1, 10.8, easeOutBack);
  if (bacteriaPop > 0.01) {
    const list = [
      { x: -75, y: 82, c: '#A78BFA', p: 0.2 },
      { x: 5, y: 105, c: '#FACC15', p: 1.5 },
      { x: 82, y: 78, c: '#4ADE80', p: 2.8 },
      { x: -20, y: 60, c: '#C084FC', p: 4.0 },
    ];
    for (const b of list) {
      const bx = b.x + Math.sin(time * 2.2 + b.p) * 14;
      const by = b.y + Math.cos(time * 2.8 + b.p) * 9;
      drawBacteria(ctx, bx, by, b.c, 22 * bacteriaPop, time, b.p);
    }
  }

  // Gelembung gas metana naik ke atas
  if (time >= 10.8) {
    ctx.fillStyle = 'rgba(235, 220, 255, 0.72)';
    for (let i = 0; i < 10; i++) {
      const cycle = (time * 0.55 + i * 0.37) % 1;
      const bx = -95 + ((i * 53) % 190) + Math.sin(time * 3 + i) * 8;
      const by = lerp(110, -135, cycle);
      const r = 6 + (i % 3) * 3;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // selesai clip dalam tangki

  // Pipa inlet miring di sisi kanan tangki
  ctx.save();
  ctx.strokeStyle = '#DCE2E8';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tankW / 2 + 52, -tankH / 2 - 42);
  ctx.lineTo(tankW / 2 - 48, 95);
  ctx.stroke();

  // Corong atas pipa inlet
  ctx.fillStyle = '#AEB8C2';
  ctx.beginPath();
  ctx.ellipse(tankW / 2 + 54, -tankH / 2 - 45, 24, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
