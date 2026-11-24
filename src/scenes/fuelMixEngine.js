import { applyCamera, evaluateCamera } from "../engine/camera.js";
import {
  clamp,
  createRandom,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  lerpColor,
  progress,
} from "../engine/math.js";
import { drawCloud, drawRoundedRect } from "../engine/shapes.js";

/**
 * Film Animasi Pendek (50 Detik) — Tanpa Slide Presentasi!
 * "Campur Pertamax dan Pertalite dalam Satu Tangki: Aman?"
 *
 * Gaya Sinematik 1-Continuous-Shot (seperti film explainer @blink.builder):
 *  - Shot 1 (0.0 -  7.5s) : SPBU hidup — motor melaju masuk, pengendara minta oplos, petugas isi hijau lalu biru
 *  - Shot 2 (7.5 - 14.5s) : Kamera ZOOM mulus masuk ke tangki motor -> X-Ray bensin hijau + biru menyatu
 *  - Shot 3 (14.5 - 21.0s): Kamera PAN turun mengikuti tetesan bensin lewat selang -> pompa -> injektor menyemprot kabut
 *  - Shot 4 (21.0 - 30.0s): Kamera tepat di dalam blok mesin 4-tak -> pembakaran normal mulus (Hisap-Kompresi-Usaha-Buang)
 *  - Shot 5 (30.0 - 40.5s): Kamera PUSH-IN dramatis -> kompresi tinggi + oplosan -> ledakan dini (Knocking/Ngelitik) + kerak karbon + kamera bergetar
 *  - Shot 6 (40.5 - 50.0s): Kamera PULL-OUT kembali ke motor yang melaju kencang di jalan sore hari (parallax pohon, lampu, roda berputar) + "+ FOLLOW"
 */

// Keyframe kamera sinematik tersinkron dengan voiceover-fuel-mix.mp3 (56 detik)
const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 960, zoom: 1.0 },
  { time: 8.2, x: 540, y: 960, zoom: 1.0 },
  { time: 9.6, x: 430, y: 1080, zoom: 2.35, ease: easeInOutCubic }, // Zoom masuk ke tangki motor!
  { time: 17.0, x: 430, y: 1080, zoom: 2.35 },
  { time: 18.6, x: 430, y: 1480, zoom: 1.95, ease: easeInOutCubic }, // Pan turun ikuti selang & injektor
  { time: 23.2, x: 430, y: 1620, zoom: 1.85 },
  { time: 24.8, x: 430, y: 2050, zoom: 1.48, ease: easeInOutCubic }, // Masuk ke blok mesin 4-tak!
  { time: 32.8, x: 430, y: 2050, zoom: 1.48 },
  { time: 34.4, x: 430, y: 1930, zoom: 1.82, ease: easeInOutCubic }, // Push-in dramatis ke ruang bakar saat knocking!
  { time: 44.6, x: 430, y: 1930, zoom: 1.82 },
  { time: 46.4, x: 540, y: 960, zoom: 1.0, ease: easeInOutCubic }, // Pull-out kembali ke jalan raya sore hari!
  { time: 56.0, x: 540, y: 960, zoom: 1.0 },
];

const rand = createRandom(4040);
const BG_BUILDINGS = Array.from({ length: 12 }, (_, i) => ({
  x: i * 190 - 200,
  w: 110 + rand() * 70,
  h: 140 + rand() * 210,
  color: i % 2 === 0 ? "#1E293B" : "#263449",
}));

export function drawFuelMixEngineScene(ctx, time, width, height) {
  // Faktor transisi sinematik (tersinkron 56 detik)
  const insideFactor =
    progress(time, 8.6, 9.6, easeInOutCubic) -
    progress(time, 44.8, 46.0, easeInOutCubic);
  const ridingAway = progress(time, 45.2, 46.6, easeInOutCubic);
  const isKnockMode = time >= 33.0 && time < 45.0;

  // Hitung getaran kamera saat knocking (33s - 45s)
  const crankAngle = (Math.max(0, time - 23.0) * 4.8) % (Math.PI * 4);
  const deg720 = (crankAngle * 180) / Math.PI;
  const isKnockingNow = isKnockMode && deg720 >= 295 && deg720 <= 385;
  const camShakeX = isKnockingNow ? Math.sin(time * 95) * 11 : 0;
  const camShakeY = isKnockingNow ? Math.cos(time * 85) * 8 : 0;

  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(
    ctx,
    { x: camera.x + camShakeX, y: camera.y + camShakeY, zoom: camera.zoom },
    width,
    height,
  );

  // 1. DUNIA LUAR: Langit, Kota, Jalan Raya, SPBU, Motor & Pengendara (y = 0 .. 1450)
  if (insideFactor < 0.98) {
    drawExteriorWorld(ctx, time, width, height, ridingAway, isKnockMode);
  }

  // 2. DUNIA X-RAY DI DALAM MOTOR
  if (insideFactor > 0.02) {
    ctx.save();
    ctx.globalAlpha = insideFactor;
    drawInternalEngineWorld(
      ctx,
      time,
      crankAngle,
      deg720,
      isKnockMode,
      isKnockingNow,
    );
    ctx.restore();
  }

  ctx.restore();

  // 3. OVERLAY LAYAR MINIMALIS (Hook awal + CTA akhir)
  if (time < 4.4) {
    drawCinematicHook(ctx, time, width, height);
  }

  if (time >= 52.8) {
    const pop = progress(time, 53.0, 53.6, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

/**
 * DUNIA LUAR: SPBU (0-8s) dan Jalan Raya Sore Hari (40.5-50s)
 */
function drawExteriorWorld(ctx, time, width, height, ridingAway, isKnockMode) {
  const groundY = 1250;
  const sunset = ridingAway;

  // Langit sore sinematik (biru senja -> oranye keemasan saat pulang)
  const skyTop = lerpColor("#1E3A5F", "#4A2545", sunset);
  const skyMid = lerpColor("#4A77A8", "#C86D51", sunset);
  const skyBot = lerpColor("#93B8D8", "#F6B87A", sunset);
  const skyGrad = ctx.createLinearGradient(0, -100, 0, groundY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(0.55, skyMid);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-400, -200, width + 800, groundY + 250);

  // Matahari sore saat pulang di akhir film
  if (sunset > 0.05) {
    ctx.save();
    ctx.globalAlpha = sunset;
    const sunGrad = ctx.createRadialGradient(840, 740, 20, 840, 740, 210);
    sunGrad.addColorStop(0, "rgba(255, 240, 180, 0.95)");
    sunGrad.addColorStop(1, "rgba(255, 180, 90, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(840, 740, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF7D6";
    ctx.beginPath();
    ctx.arc(840, 740, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Awan bergerak
  const cloudDrift = time * 18 + ridingAway * (time - 45) * 60;
  drawCloud(
    ctx,
    ((((220 - cloudDrift * 0.4) % 1500) + 1500) % 1500) - 200,
    320,
    1.0,
    "#FFF5E6",
    0.65,
  );
  drawCloud(
    ctx,
    ((((840 - cloudDrift * 0.25) % 1500) + 1500) % 1500) - 200,
    420,
    0.85,
    "#FFE8D6",
    0.55,
  );

  // Siluet gedung kota parallax di kejauhan
  const scrollX = ridingAway > 0.05 ? (time - 45.2) * 260 * ridingAway : 0;
  for (const b of BG_BUILDINGS) {
    const bx = ((((b.x - scrollX * 0.35) % 2200) + 2200) % 2200) - 300;
    ctx.fillStyle = b.color;
    ctx.fillRect(bx, groundY - b.h, b.w, b.h);
  }

  // Aspal jalan raya & marka bergerak
  ctx.fillStyle = "#1E293B";
  ctx.fillRect(-400, groundY, width + 800, 850);
  ctx.fillStyle = "#475569";
  ctx.fillRect(-400, groundY, width + 800, 12);

  // Marka jalan putih putus-putus bergerak saat motor melaju
  ctx.fillStyle = "#E2E8F0";
  const dashOffset = (scrollX * 2.2) % 160;
  for (let x = -200 - dashOffset; x < width + 400; x += 160) {
    drawRoundedRect(ctx, x, groundY + 95, 76, 14, 6);
    ctx.fill();
  }

  // Bangunan SPBU (bergeser ke kiri hilang saat motor melaju pergi di akhir!)
  const spbuShiftX = ridingAway > 0.01 ? -(time - 45.2) * 520 * ridingAway : 0;
  if (spbuShiftX > -1200) {
    ctx.save();
    ctx.translate(spbuShiftX, 0);
    drawSPBUStructure(ctx, time, groundY, width, ridingAway);
    ctx.restore();
  }

  // Motor & Pengendara (masuk mulus ke SPBU di 0-1.3s, lalu melaju stabil di 45.5-56s)
  const bikeX =
    lerp(-180, 350, progress(time, 0.0, 1.3, easeOutCubic)) + ridingAway * 90;
  const wheelSpin =
    ridingAway > 0.05 ? (time - 45.2) * 18 : progress(time, 0.0, 1.3) * 8;
  const bikeBounce = ridingAway > 0.05 ? Math.sin(time * 18) * 3 : 0;

  // Asap knalpot halus saat motor melaju di akhir
  if (ridingAway > 0.2) {
    for (let i = 0; i < 6; i++) {
      const c = (time * 1.4 + i * 0.2) % 1;
      const ex = bikeX - 135 - c * 150;
      const ey = groundY - 56 - c * 28 + Math.sin(time * 5 + i) * 6;
      ctx.fillStyle = `rgba(226, 232, 240, ${(1 - c) * 0.45 * ridingAway})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 10 + c * 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDetailedMotorcycle(ctx, bikeX, groundY - 10 + bikeBounce, wheelSpin);
  drawRider(ctx, bikeX - 24, groundY - 185 + bikeBounce);

  // Balon Dialog Pengendara di SPBU (1.5s - 5.4s)
  if (time >= 1.4 && time < 5.6) {
    const pop =
      progress(time, 1.4, 1.9, easeOutBack) *
      (1 - progress(time, 5.1, 5.6, easeInOutCubic));
    if (pop > 0.01) {
      ctx.save();
      ctx.translate(390, 745);
      ctx.scale(clamp(pop, 0.01, 1.04), clamp(pop, 0.01, 1.04));
      ctx.fillStyle = "#FFFFFF";
      drawRoundedRect(ctx, -265, -60, 530, 114, 24);
      ctx.fill();
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(-60, 52);
      ctx.lineTo(-92, 90);
      ctx.lineTo(-22, 52);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0F172A";
      ctx.font = "900 29px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("“Mas, campur Pertalite", 0, -14);
      ctx.fillStyle = "#2563EB";
      ctx.fillText("sama Pertamax ya!”", 0, 26);
      ctx.restore();
    }
  }
}

function drawSPBUStructure(ctx, time, groundY, width, ridingAway) {
  // Kanopi SPBU
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(0, 485, width, 72);
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 557, width, 16);
  ctx.fillStyle = "#2563EB";
  ctx.fillRect(0, 573, width, 22);
  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(72, 595, 46, groundY - 595);
  ctx.fillRect(width - 118, 595, 46, groundY - 595);

  // Dispenser BBM kanan
  const dx = 780;
  const dy = groundY - 380;
  ctx.fillStyle = "#64748B";
  drawRoundedRect(ctx, dx - 115, groundY - 32, 230, 36, 10);
  ctx.fill();

  ctx.fillStyle = "#F1F5F9";
  drawRoundedRect(ctx, dx - 88, dy, 176, 348, 18);
  ctx.fill();
  ctx.fillStyle = "#DC2626";
  drawRoundedRect(ctx, dx - 88, dy, 176, 58, 18);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPBU", dx, dy + 36);

  // Layar liter & harga berjalan
  const liter = lerp(0, 3.5, progress(time, 2.8, 7.2));
  const harga = Math.round(liter * 11500);
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, dx - 70, dy + 78, 140, 88, 10);
  ctx.fill();
  ctx.fillStyle = "#4ADE80";
  ctx.font = "bold 21px Consolas, monospace";
  ctx.fillText(`Rp ${harga.toLocaleString("id-ID")}`, dx, dy + 112);
  ctx.fillStyle = "#38BDF8";
  ctx.fillText(`${liter.toFixed(2)} L`, dx, dy + 146);

  // Slot Nozzle Hijau & Biru
  ctx.fillStyle = "#16A34A";
  drawRoundedRect(ctx, dx - 66, dy + 190, 56, 92, 10);
  ctx.fill();
  ctx.fillStyle = "#2563EB";
  drawRoundedRect(ctx, dx + 10, dy + 190, 56, 92, 10);
  ctx.fill();

  // Petugas SPBU
  drawAttendant(ctx, 595, groundY - 12);

  // Selang nozzle aktif (hijau 2.5-5.0s, biru 5.0-7.5s)
  if (ridingAway < 0.05) {
    const useBlue = time >= 5.0;
    ctx.strokeStyle = useBlue ? "#2563EB" : "#16A34A";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(useBlue ? dx + 38 : dx - 38, dy + 236);
    ctx.quadraticCurveTo(640, groundY - 75, 455, groundY - 170);
    ctx.stroke();
  }
}

function drawAttendant(ctx, x, footY) {
  ctx.save();
  ctx.translate(x, footY);
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -22, -125, 19, 125, 8);
  ctx.fill();
  drawRoundedRect(ctx, 4, -125, 19, 125, 8);
  ctx.fill();
  ctx.fillStyle = "#DC2626";
  drawRoundedRect(ctx, -30, -245, 60, 128, 16);
  ctx.fill();
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 17;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, -218);
  ctx.lineTo(-105, -168);
  ctx.stroke();
  ctx.fillStyle = "#FDBA74";
  ctx.beginPath();
  ctx.arc(0, -280, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#B91C1C";
  ctx.beginPath();
  ctx.arc(0, -288, 30, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-42, -292, 46, 9);
  ctx.restore();
}

function drawDetailedMotorcycle(ctx, x, groundY, wheelSpin) {
  ctx.save();
  ctx.translate(x, groundY);

  // Roda depan & belakang berputar
  for (const wx of [-98, 108]) {
    ctx.save();
    ctx.translate(wx, -48);
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94A3B8";
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    // Jari-jari roda berputar
    ctx.rotate(wheelSpin);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(22, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Knalpot metalik
  ctx.fillStyle = "#64748B";
  drawRoundedRect(ctx, -135, -68, 110, 22, 10);
  ctx.fill();

  // Blok mesin terlihat di bawah rangka
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, -22, -108, 72, 56, 10);
  ctx.fill();

  // Rangka & bodi motor
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -118, -142, 236, 56, 20);
  ctx.fill();

  // Tangki bensin metalik (pas di posisi zoom-in kamera!)
  const tankG = ctx.createLinearGradient(16, -176, 96, -128);
  tankG.addColorStop(0, "#E2E8F0");
  tankG.addColorStop(1, "#94A3B8");
  ctx.fillStyle = tankG;
  drawRoundedRect(ctx, 16, -176, 84, 52, 18);
  ctx.fill();

  // Garis stang & lampu depan menyala
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(108, -48);
  ctx.lineTo(86, -202);
  ctx.stroke();
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(118, -172, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRider(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, -28, -82, 56, 104, 16);
  ctx.fill();
  ctx.fillStyle = "#38BDF8";
  ctx.beginPath();
  ctx.arc(4, -120, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, 8, -132, 30, 18, 6);
  ctx.fill();
  ctx.restore();
}

/**
 * DUNIA X-RAY CONTINUOUS DI DALAM MOTOR (y = 850 .. 2550):
 * Tangki (y=1080) -> Selang + Fuel Pump + Injektor (y=1300..1720) -> Mesin 4-Tak (y=1760..2420)
 */
function drawInternalEngineWorld(
  ctx,
  time,
  crankAngle,
  deg720,
  isKnockMode,
  isKnockingNow,
) {
  const cx = 430;

  // Latar ruang X-Ray mekanikal gelap
  const bgTop = isKnockMode ? "#240C10" : "#090F1A";
  const bgBot = isKnockMode ? "#331218" : "#131E30";
  const bgGrad = ctx.createLinearGradient(0, 700, 0, 2600);
  bgGrad.addColorStop(0, bgTop);
  bgGrad.addColorStop(1, bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-200, 680, 1400, 2000);

  // =========================================================================
  // BAGIAN A: TANGKI BENSIN TRANSPARAN (y = 1080)
  // =========================================================================
  const tankY = 1080;
  const tankW = 340;
  const tankH = 215;

  // Casing logam tangki
  const metalG = ctx.createLinearGradient(
    cx - tankW / 2,
    tankY - tankH / 2,
    cx + tankW / 2,
    tankY + tankH / 2,
  );
  metalG.addColorStop(0, "#64748B");
  metalG.addColorStop(0.4, "#CBD5E1");
  metalG.addColorStop(1, "#334155");
  ctx.fillStyle = metalG;
  drawRoundedRect(ctx, cx - tankW / 2, tankY - tankH / 2, tankW, tankH, 38);
  ctx.fill();

  const ix = cx - tankW / 2 + 14;
  const iy = tankY - tankH / 2 + 14;
  const iw = tankW - 28;
  const ih = tankH - 28;

  ctx.save();
  drawRoundedRect(ctx, ix, iy, iw, ih, 26);
  ctx.clip();
  ctx.fillStyle = "#0B1320";
  ctx.fillRect(ix, iy, iw, ih);

  // Cairan Pertalite (Hijau) + Pertamax (Biru) menyatu
  const mixProg = progress(time, 8.2, 12.2, easeInOutCubic);
  const liqTop = iy + ih * 0.24;
  const topCol = lerpColor("#22C55E", "#0EA5E9", mixProg * 0.62);
  const botCol = lerpColor("#15803D", "#1D4ED8", mixProg * 0.62);
  const liqG = ctx.createLinearGradient(0, liqTop, 0, iy + ih);
  liqG.addColorStop(0, topCol);
  liqG.addColorStop(1, botCol);
  ctx.fillStyle = liqG;

  ctx.beginPath();
  ctx.moveTo(ix, iy + ih);
  for (let x = ix; x <= ix + iw; x += 12) {
    const wave = Math.sin(x * 0.04 + time * 5.5) * 6;
    ctx.lineTo(x, liqTop + wave);
  }
  ctx.lineTo(ix + iw, iy + ih);
  ctx.closePath();
  ctx.fill();

  // Pusaran gelembung & partikel aditif kuning yang makin renggang (encer)
  for (let i = 0; i < 10; i++) {
    const cyc = (time * 0.55 + i * 0.23) % 1;
    const bx = ix + 30 + ((i * 57) % (iw - 60)) + Math.sin(time * 3 + i) * 10;
    const by = lerp(iy + ih - 10, liqTop + 10, cyc);
    ctx.fillStyle =
      i % 3 === 0 ? "rgba(253, 224, 71, 0.7)" : "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.arc(bx, by, 3.5 + (i % 2) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Tag diegetik kecil di kaca tangki (bukan judul slide!)
  const ron = lerp(90.0, 91.0, mixProg);
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  drawRoundedRect(ctx, cx - 86, tankY - 18, 172, 38, 12);
  ctx.fill();
  ctx.fillStyle = "#38BDF8";
  ctx.font = "900 20px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`≈ RON ${ron.toFixed(1)}`, cx, tankY + 2);

  // =========================================================================
  // BAGIAN B: SELANG BENSIN -> FUEL PUMP -> INJEKTOR (y = 1190 .. 1760)
  // =========================================================================
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, tankY + tankH / 2);
  ctx.bezierCurveTo(cx, 1340, cx - 50, 1440, cx - 72, 1690);
  ctx.stroke();

  // Tetesan bensin oplosan mengalir sepanjang selang menuju klep masuk!
  ctx.fillStyle = "#0EA5E9";
  for (let i = 0; i < 8; i++) {
    const t = (time * 0.65 + i / 8) % 1;
    const inv = 1 - t;
    const px =
      inv * inv * inv * cx +
      3 * inv * inv * t * cx +
      3 * inv * t * t * (cx - 50) +
      t * t * t * (cx - 72);
    const py =
      inv * inv * inv * (tankY + tankH / 2) +
      3 * inv * inv * t * 1340 +
      3 * inv * t * t * 1440 +
      t * t * t * 1690;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fuel Pump berputar di tengah selang (y = 1435)
  ctx.save();
  ctx.translate(cx - 24, 1435);
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.rotate(time * 7);
  ctx.strokeStyle = "#FBBF24";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Injektor menyemprotkan kabut halus ke saluran masuk (y = 1665)
  ctx.fillStyle = "#94A3B8";
  drawRoundedRect(ctx, cx - 86, 1625, 28, 56, 6);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const c = (time * 2.2 + i * 0.17) % 1;
    const spread = (i - 4) * 8 * c;
    ctx.fillStyle = `rgba(56, 189, 248, ${(1 - c) * 0.8})`;
    ctx.beginPath();
    ctx.arc(cx - 72 + spread, 1682 + c * 62, 3 + c * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // BAGIAN C: PENAMPANG MESIN 4-TAK REALISTIS (y = 1780 .. 2420)
  // =========================================================================
  const cylTopY = 1785;
  const cylBotY = 2125;
  const crankY = 2280;
  const crankRadius = 88;
  const rodLength = 235;
  const cylInnerHalfW = 126;

  const pinX = cx + Math.sin(crankAngle) * crankRadius;
  const pinY = crankY - Math.cos(crankAngle) * crankRadius;
  const dx = pinX - cx;
  const pistonPinY =
    pinY - Math.sqrt(Math.max(1, rodLength * rodLength - dx * dx));
  const pistonTopY = pistonPinY - 60;
  const carbonBuildup = progress(time, 34.5, 44.2, easeOutCubic);

  drawCylinderBlock(ctx, cx, cylTopY, cylBotY, cylInnerHalfW, crankY);
  drawPortsAndValves(ctx, cx, cylTopY, deg720);

  const chamberH = Math.max(18, pistonTopY - cylTopY);
  drawCombustionChamber(
    ctx,
    cx,
    cylTopY,
    cylInnerHalfW,
    chamberH,
    deg720,
    isKnockMode,
  );
  drawSparkPlug(ctx, cx, cylTopY, deg720 >= 352 && deg720 <= 385);
  drawCrankshaft(ctx, cx, crankY, crankRadius, crankAngle);
  drawConnectingRod(ctx, pinX, pinY, cx, pistonPinY);
  drawPiston(
    ctx,
    cx,
    pistonTopY,
    236,
    122,
    pistonPinY,
    carbonBuildup,
    isKnockingNow,
  );
}

function drawCylinderBlock(ctx, cx, cylTopY, cylBotY, innerHalfW, crankY) {
  const finGrad = ctx.createLinearGradient(cx - 240, 0, cx + 240, 0);
  finGrad.addColorStop(0, "#334155");
  finGrad.addColorStop(0.5, "#64748B");
  finGrad.addColorStop(1, "#334155");
  ctx.fillStyle = finGrad;
  for (let y = cylTopY + 24; y <= cylBotY - 24; y += 34) {
    drawRoundedRect(ctx, cx - innerHalfW - 84, y, 56, 14, 5);
    ctx.fill();
    drawRoundedRect(ctx, cx + innerHalfW + 28, y, 56, 14, 5);
    ctx.fill();
  }

  const caseGrad = ctx.createRadialGradient(
    cx - 36,
    crankY - 36,
    20,
    cx,
    crankY,
    185,
  );
  caseGrad.addColorStop(0, "#475569");
  caseGrad.addColorStop(0.7, "#1E293B");
  caseGrad.addColorStop(1, "#0F172A");
  ctx.fillStyle = caseGrad;
  ctx.beginPath();
  ctx.arc(cx, crankY, 168, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#64748B";
  ctx.lineWidth = 9;
  ctx.stroke();

  const wallGrad = ctx.createLinearGradient(
    cx - innerHalfW - 32,
    0,
    cx - innerHalfW,
    0,
  );
  wallGrad.addColorStop(0, "#475569");
  wallGrad.addColorStop(0.5, "#94A3B8");
  wallGrad.addColorStop(1, "#334155");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(cx - innerHalfW - 32, cylTopY - 20, 32, cylBotY - cylTopY + 55);
  ctx.fillRect(cx + innerHalfW, cylTopY - 20, 32, cylBotY - cylTopY + 55);

  ctx.fillStyle = "#475569";
  drawRoundedRect(
    ctx,
    cx - innerHalfW - 52,
    cylTopY - 92,
    (innerHalfW + 52) * 2,
    94,
    18,
  );
  ctx.fill();

  const boreGrad = ctx.createLinearGradient(
    cx - innerHalfW,
    0,
    cx + innerHalfW,
    0,
  );
  boreGrad.addColorStop(0, "#1E293B");
  boreGrad.addColorStop(0.3, "#334155");
  boreGrad.addColorStop(0.7, "#293548");
  boreGrad.addColorStop(1, "#0F172A");
  ctx.fillStyle = boreGrad;
  ctx.fillRect(
    cx - innerHalfW,
    cylTopY,
    innerHalfW * 2,
    cylBotY - cylTopY + 32,
  );
}

function drawPortsAndValves(ctx, cx, cylTopY, deg720) {
  const intakeOpen = deg720 < 180 ? Math.sin((deg720 / 180) * Math.PI) : 0;
  const exhaustOpen =
    deg720 >= 540 ? Math.sin(((deg720 - 540) / 180) * Math.PI) : 0;

  ctx.fillStyle = "#0C4A6E";
  ctx.beginPath();
  ctx.moveTo(cx - 240, cylTopY - 58);
  ctx.lineTo(cx - 60, cylTopY - 58);
  ctx.lineTo(cx - 60, cylTopY + 2);
  ctx.lineTo(cx - 104, cylTopY + 2);
  ctx.lineTo(cx - 120, cylTopY - 20);
  ctx.lineTo(cx - 240, cylTopY - 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7C2D12";
  ctx.beginPath();
  ctx.moveTo(cx + 240, cylTopY - 58);
  ctx.lineTo(cx + 60, cylTopY - 58);
  ctx.lineTo(cx + 60, cylTopY + 2);
  ctx.lineTo(cx + 104, cylTopY + 2);
  ctx.lineTo(cx + 120, cylTopY - 20);
  ctx.lineTo(cx + 240, cylTopY - 20);
  ctx.closePath();
  ctx.fill();

  drawSingleValve(ctx, cx - 72, cylTopY, intakeOpen * 30, "#38BDF8");
  drawSingleValve(ctx, cx + 72, cylTopY, exhaustOpen * 30, "#FB923C");
}

function drawSingleValve(ctx, x, seatY, lift, color) {
  ctx.save();
  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(x - 5, seatY - 120 + lift, 10, 123);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 26, seatY + lift + 5);
  ctx.lineTo(x + 26, seatY + lift + 5);
  ctx.lineTo(x + 11, seatY + lift - 7);
  ctx.lineTo(x - 11, seatY + lift - 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const sy = seatY - 116 + lift + (i / 5) * (54 - lift * 0.45);
    const sx = x + (i % 2 === 0 ? -12 : 12);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSparkPlug(ctx, cx, cylTopY, isFiring) {
  ctx.save();
  ctx.fillStyle = "#F1F5F9";
  drawRoundedRect(ctx, cx - 14, cylTopY - 140, 28, 76, 6);
  ctx.fill();
  ctx.fillStyle = "#94A3B8";
  ctx.fillRect(cx - 11, cylTopY - 64, 22, 66);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cylTopY + 2);
  ctx.lineTo(cx, cylTopY + 13);
  ctx.moveTo(cx + 8, cylTopY + 2);
  ctx.lineTo(cx + 8, cylTopY + 19);
  ctx.lineTo(cx - 2, cylTopY + 19);
  ctx.stroke();

  if (isFiring) {
    const glow = ctx.createRadialGradient(
      cx,
      cylTopY + 15,
      2,
      cx,
      cylTopY + 15,
      44,
    );
    glow.addColorStop(0, "rgba(255, 255, 255, 1)");
    glow.addColorStop(0.4, "rgba(96, 165, 250, 0.9)");
    glow.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cylTopY + 15, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCombustionChamber(
  ctx,
  cx,
  cylTopY,
  halfW,
  chamberH,
  deg720,
  isKnockMode,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - halfW, cylTopY, halfW * 2, chamberH);
  ctx.clip();

  if (deg720 < 180) {
    ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + (deg720 / 180) * 0.35})`;
    ctx.fillRect(cx - halfW, cylTopY, halfW * 2, chamberH);
  } else if (deg720 < 360) {
    const comp = (deg720 - 180) / 180;
    ctx.globalAlpha = 0.45 + comp * 0.4;
    ctx.fillStyle = lerpColor(
      "#0284C7",
      isKnockMode ? "#DC2626" : "#F59E0B",
      comp,
    );
    ctx.fillRect(cx - halfW, cylTopY, halfW * 2, chamberH);

    // KNOCKING: Ledakan dini menghantam piston SEBELUM busi memercik!
    if (isKnockMode && deg720 >= 295) {
      const kProg = (deg720 - 295) / 65;
      const blastR = 22 + kProg * 95;
      for (const ox of [-72, 68]) {
        const g = ctx.createRadialGradient(
          cx + ox,
          cylTopY + chamberH * 0.65,
          4,
          cx + ox,
          cylTopY + chamberH * 0.65,
          blastR,
        );
        g.addColorStop(0, "rgba(255, 255, 220, 0.98)");
        g.addColorStop(0.45, "rgba(255, 90, 20, 0.88)");
        g.addColorStop(1, "rgba(220, 38, 38, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + ox, cylTopY + chamberH * 0.65, blastR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (deg720 < 540) {
    const exp = (deg720 - 360) / 180;
    const flameGrad = ctx.createRadialGradient(
      cx,
      cylTopY + 24,
      10,
      cx,
      cylTopY + chamberH * 0.5,
      halfW * 1.4,
    );
    if (isKnockMode) {
      flameGrad.addColorStop(0, `rgba(255, 240, 180, ${1 - exp * 0.6})`);
      flameGrad.addColorStop(0.5, `rgba(239, 68, 68, ${0.9 - exp * 0.5})`);
      flameGrad.addColorStop(1, `rgba(127, 29, 29, ${0.5 - exp * 0.4})`);
    } else {
      flameGrad.addColorStop(0, `rgba(255, 255, 240, ${1 - exp * 0.6})`);
      flameGrad.addColorStop(0.4, `rgba(56, 189, 248, ${0.85 - exp * 0.55})`);
      flameGrad.addColorStop(1, `rgba(249, 115, 22, ${0.65 - exp * 0.5})`);
    }
    ctx.fillStyle = flameGrad;
    ctx.fillRect(cx - halfW, cylTopY, halfW * 2, chamberH);
  } else {
    const ex = (deg720 - 540) / 180;
    ctx.fillStyle = `rgba(148, 163, 184, ${(1 - ex) * 0.45})`;
    ctx.fillRect(cx - halfW, cylTopY, halfW * 2, chamberH);
  }
  ctx.restore();
}

function drawCrankshaft(ctx, cx, crankY, radius, theta) {
  ctx.save();
  ctx.translate(cx, crankY);
  ctx.rotate(theta);
  const cwGrad = ctx.createLinearGradient(-86, -86, 86, 86);
  cwGrad.addColorStop(0, "#94A3B8");
  cwGrad.addColorStop(0.5, "#475569");
  cwGrad.addColorStop(1, "#1E293B");
  ctx.fillStyle = cwGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 32, 0.25, Math.PI - 0.25);
  ctx.lineTo(-28, -radius - 10);
  ctx.arc(0, -radius, 28, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawConnectingRod(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.arc(x1, y1, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPiston(ctx, cx, topY, w, h, pinY, carbonBuildup, isKnockingNow) {
  ctx.save();
  const pGrad = ctx.createLinearGradient(cx - w / 2, topY, cx + w / 2, topY);
  pGrad.addColorStop(0, "#475569");
  pGrad.addColorStop(0.25, "#E2E8F0");
  pGrad.addColorStop(0.55, "#94A3B8");
  pGrad.addColorStop(0.85, "#CBD5E1");
  pGrad.addColorStop(1, "#334155");
  ctx.fillStyle = pGrad;
  drawRoundedRect(ctx, cx - w / 2, topY, w, h, 10);
  ctx.fill();

  ctx.fillStyle = "#1E293B";
  ctx.fillRect(cx - w / 2, topY + 18, w, 6);
  ctx.fillRect(cx - w / 2, topY + 32, w, 6);
  ctx.fillRect(cx - w / 2, topY + 46, w, 6);

  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.arc(cx, pinY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#CBD5E1";
  ctx.beginPath();
  ctx.arc(cx, pinY, 11, 0, Math.PI * 2);
  ctx.fill();

  // Kerak karbon hitam menebal di atas piston
  if (carbonBuildup > 0.02) {
    ctx.fillStyle = `rgba(12, 12, 16, ${0.9 * carbonBuildup})`;
    drawRoundedRect(
      ctx,
      cx - w / 2 + 4,
      topY - 4,
      w - 8,
      18 * carbonBuildup + 4,
      6,
    );
    ctx.fill();
  }

  if (isKnockingNow) {
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, cx - w / 2, topY, w, h, 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAutoPill(
  ctx,
  cx,
  cy,
  text,
  font,
  bgColor,
  textColor,
  borderColor = null,
  h = 72,
) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(240, ctx.measureText(text).width + 64);
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 2);
  ctx.restore();
}

function drawCinematicHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.6, 4.2, easeInOutCubic);
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
    "⚠ AMAN ATAU MERUSAK MESIN?!",
    "900 36px Arial, sans-serif",
    "#DC2626",
    "#FDE047",
    "#FDE047",
    72,
  );

  ctx.lineJoin = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.font = "900 52px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("CAMPUR PERTAMAX & PERTALITE?", 0, 18);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("CAMPUR PERTAMAX & PERTALITE?", 0, 18);
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
  ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#EF4444";
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 49);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 49);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 42px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+ FOLLOW", 0, 2);
  ctx.restore();
}
