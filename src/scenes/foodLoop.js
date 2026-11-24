import { applyCamera, evaluateCamera } from "../engine/camera.js";
import {
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  lerpColor,
  progress,
} from "../engine/math.js";
import {
  drawBlueFlame,
  drawCloud,
  drawRoundedRect,
  drawScrap,
} from "../engine/shapes.js";

/**
 * Film Animasi 1-Shot Sinematik (62 Detik — 6 Scene Bersambung) dengan Tokoh Utama: RANI
 * "Mengubah Limbah Makanan Rumah Tangga Menjadi Bahan Makanan Kembali"
 *
 * 1 Dunia Rumah + Kebun Bersambung (x = 0 .. 2600), diikuti Rani secara langsung:
 *  - Scene 1 (0.0 - 11.5s) : The Problem — Rani memotong sayur di dapur & menyapu sisa ke tempat sampah
 *  - Scene 2 (11.5 - 20.5s): The Realization — Ide menyala! Rani memilah sisa makanan ke baki Regrowing & Kompos
 *  - Scene 3 (20.5 - 31.5s): The Solution — Rani menaruh pangkal sayur di gelas air & kulit buah ke wadah kompos
 *  - Scene 4 (31.5 - 41.5s): The Growing Process — Rani menyiram kebun pot dengan gembor air & kompos buatannya
 *  - Scene 5 (41.5 - 50.0s): The Harvest — Rani menggunting & memanen sayuran segar ke keranjang panen
 *  - Scene 6 (50.0 - 62.0s): Back to the Kitchen — Rani memasak hasil panen di dapur untuk keluarga + siklus berulang + "+ FOLLOW"
 */

const COUNTER_Y = 1080;

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 940, zoom: 1.0 },
  { time: 13.8, x: 540, y: 940, zoom: 1.0 },
  { time: 15.2, x: 540, y: 970, zoom: 1.16, ease: easeInOutCubic }, // Scene 2: Zoom ke Rani & meja pemilahan (14.2s)
  { time: 24.0, x: 540, y: 970, zoom: 1.16 },
  { time: 25.5, x: 1340, y: 950, zoom: 1.08, ease: easeInOutCubic }, // Scene 3: Rani di meja jendela Regrowing & Kompos (24.5s)
  { time: 35.8, x: 1340, y: 950, zoom: 1.08 },
  { time: 37.2, x: 2080, y: 940, zoom: 1.04, ease: easeInOutCubic }, // Scene 4: Rani menyiram kebun pot (36.2s)
  { time: 46.2, x: 2080, y: 940, zoom: 1.04 },
  { time: 47.6, x: 2080, y: 930, zoom: 1.24, ease: easeInOutCubic }, // Scene 5: Push-in Rani panen sayur segar (46.6s)
  { time: 56.2, x: 2080, y: 930, zoom: 1.24 },
  { time: 57.8, x: 540, y: 940, zoom: 1.0, ease: easeInOutCubic }, // Scene 6: Rani kembali ke dapur memasak (57.0s)
  { time: 70.0, x: 540, y: 940, zoom: 1.0 },
];

function drawAutoPill(
  ctx,
  cx,
  cy,
  text,
  font,
  bgColor,
  textColor,
  borderColor = null,
  h = 64,
) {
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 2);
  ctx.restore();
}

/**
 * Menghitung posisi, ekspresi, dan aksi tokoh utama (Rani) secara mulus mengikuti timeline 1-shot.
 */
function getRaniState(time) {
  // Posisi X mengikuti kamera agar Rani benar-benar berpindah dari Dapur -> Meja Jendela -> Kebun -> Dapur
  let x = 415;
  let facing = 1; // 1 = menghadap kanan, -1 = menghadap kiri
  let mood = "meh"; // 'meh' | 'aha' | 'happy' | 'excited' | 'proud'
  let action = "chop"; // 'chop' | 'sort' | 'regrow' | 'compost' | 'water' | 'harvest' | 'cook' | 'serve'
  let hat = false;

  if (time < 14.0) {
    x = 390;
    facing = 1;
    mood = time > 9.0 ? "worried" : "meh";
    action = "chop";
  } else if (time < 24.4) {
    x = lerp(390, 535, progress(time, 14.0, 15.2, easeInOutCubic));
    facing = 1;
    mood = time < 18.5 ? "aha" : "happy";
    action = "sort";
  } else if (time < 36.2) {
    const walkToWindow = progress(time, 24.4, 25.8, easeInOutCubic);
    const shiftToCompost = progress(time, 30.2, 31.6, easeInOutCubic);
    x = lerp(535, 1250, walkToWindow) + shiftToCompost * 230;
    facing = 1;
    mood = "happy";
    action = time < 30.3 ? "regrow" : "compost";
  } else if (time < 46.5) {
    const walkToGarden = progress(time, 36.2, 37.6, easeInOutCubic);
    x =
      lerp(1480, 1980, walkToGarden) + Math.sin(time * 0.9) * 90 * walkToGarden;
    facing = 1;
    mood = "happy";
    action = "water";
    hat = walkToGarden > 0.5;
  } else if (time < 56.6) {
    x = lerp(2020, 2075, progress(time, 46.5, 47.8, easeInOutCubic));
    facing = 1;
    mood = "excited";
    action = "harvest";
    hat = true;
  } else {
    const walkHome = progress(time, 56.6, 58.0, easeInOutCubic);
    x = lerp(2075, 575, walkHome);
    facing = time > 61.8 ? -1 : 1;
    mood = "proud";
    action = time < 62.0 ? "cook" : "serve";
    hat = false;
  }

  return { x, y: COUNTER_Y, facing, mood, action, hat };
}

/**
 * Menggambar tubuh & ekspresi Rani (berdiri di belakang meja/pot).
 */
function drawRaniBody(ctx, rani, time) {
  const { x, y, facing, mood, action, hat } = rani;
  const bob = Math.sin(time * (action === "chop" ? 7 : 3.2)) * 4;
  const headY = y - 245 + bob;

  ctx.save();
  ctx.translate(x, 0);

  // Rambut belakang & cepol rapi
  ctx.fillStyle = "#2B1B17";
  ctx.beginPath();
  ctx.arc(-18 * facing, headY - 48, 26, 0, Math.PI * 2); // cepol rambut
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, headY - 8, 56, 0, Math.PI * 2);
  ctx.fill();

  // Leher
  ctx.fillStyle = "#F2C19B";
  drawRoundedRect(ctx, -14, headY + 34, 28, 30, 8);
  ctx.fill();

  // Badan (Kaos krem hangat + Celemek hijau sage)
  ctx.fillStyle = "#FEF3C7";
  drawRoundedRect(ctx, -58, headY + 56, 116, 192, 34);
  ctx.fill();

  // Celemek hijau sage dengan tali & saku depan
  ctx.fillStyle = "#15803D";
  drawRoundedRect(ctx, -44, headY + 86, 88, 162, 16);
  ctx.fill();
  ctx.strokeStyle = "#166534";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-26, headY + 88);
  ctx.lineTo(-24, headY + 58);
  ctx.moveTo(26, headY + 88);
  ctx.lineTo(24, headY + 58);
  ctx.stroke();
  // Saku celemek
  ctx.fillStyle = "#16A34A";
  drawRoundedRect(ctx, -24, headY + 148, 48, 34, 8);
  ctx.fill();

  // Kepala / Wajah Rani
  ctx.fillStyle = "#F7C9A6";
  ctx.beginPath();
  ctx.arc(0, headY, 50, 0, Math.PI * 2);
  ctx.fill();

  // Poni rambut melengkung hangat
  ctx.fillStyle = "#2B1B17";
  ctx.beginPath();
  ctx.arc(0, headY - 12, 50, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();

  // Pipi merona
  ctx.fillStyle = "rgba(244, 114, 182, 0.35)";
  ctx.beginPath();
  ctx.ellipse(-22, headY + 12, 10, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(22, headY + 12, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mata & Alis Ekspresif (berkedip alami tiap ~3.6 detik)
  const blink = Math.sin(time * 1.7) > 0.96;
  const eyeOffset = 4 * facing;
  ctx.fillStyle = "#1E293B";
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 3.5;

  if (blink) {
    ctx.beginPath();
    ctx.moveTo(-22 + eyeOffset, headY);
    ctx.lineTo(-10 + eyeOffset, headY);
    ctx.moveTo(10 + eyeOffset, headY);
    ctx.lineTo(22 + eyeOffset, headY);
    ctx.stroke();
  } else if (mood === "excited" || mood === "proud") {
    // Mata senyum melengkung bahagia
    ctx.beginPath();
    ctx.arc(-16 + eyeOffset, headY + 2, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16 + eyeOffset, headY + 2, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    const rEye = mood === "aha" ? 6.5 : 5.2;
    ctx.beginPath();
    ctx.arc(-16 + eyeOffset, headY, rEye, 0, Math.PI * 2);
    ctx.arc(16 + eyeOffset, headY, rEye, 0, Math.PI * 2);
    ctx.fill();
    // Kilau mata putih
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-18 + eyeOffset, headY - 2, 2, 0, Math.PI * 2);
    ctx.arc(14 + eyeOffset, headY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mulut sesuai mood
  ctx.strokeStyle = "#9A3412";
  ctx.lineWidth = 3.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (mood === "meh") {
    ctx.moveTo(-10 + eyeOffset, headY + 22);
    ctx.lineTo(10 + eyeOffset, headY + 22);
    ctx.stroke();
  } else if (mood === "worried") {
    ctx.arc(eyeOffset, headY + 28, 10, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (mood === "aha") {
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(eyeOffset, headY + 23, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Senyum lebar hangat
    ctx.arc(eyeOffset, headY + 16, 13, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }

  // Topi jerami berkebun saat di Kebun (Scene 4 & 5)
  if (hat) {
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.ellipse(0, headY - 38, 72, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(0, headY - 40, 40, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#16A34A";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-38, headY - 41);
    ctx.lineTo(38, headY - 41);
    ctx.stroke();
  }

  // Lampu ide menyala di atas kepala Rani saat momen "Aha!" (Scene 2 awal: 14.2s - 18.6s)
  if (time >= 14.2 && time <= 18.6) {
    const bulbPop =
      progress(time, 14.3, 14.9, easeOutBack) *
      (1 - progress(time, 18.0, 18.6));
    if (bulbPop > 0.02) {
      ctx.save();
      ctx.translate(64, headY - 72);
      ctx.scale(bulbPop, bulbPop);
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
      glow.addColorStop(0, "rgba(253, 224, 71, 0.95)");
      glow.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(0, -4, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#64748B";
      drawRoundedRect(ctx, -8, 12, 16, 10, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Menggambar tangan & alat kerja Rani di depan meja/pot agar interaksi terasa hidup & nyata.
 */
function drawRaniForegroundHands(ctx, rani, time) {
  const { x, y, action } = rani;
  const shoulderY = y - 165;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (action === "chop") {
    // Tangan kiri menahan sayur di talenan, tangan kanan memotong dengan pisau dapur
    const chopCycle = Math.sin(time * 9);
    const knifeY = y - 34 + chopCycle * 14;

    drawArm(ctx, x - 44, shoulderY, 245, y - 34);
    drawArm(ctx, x + 44, shoulderY, 335, knifeY);

    // Pisau dapur di tangan kanan
    ctx.save();
    ctx.translate(335, knifeY);
    ctx.rotate(-0.18 + chopCycle * 0.14);
    ctx.fillStyle = "#78350F";
    drawRoundedRect(ctx, -10, -8, 34, 14, 4);
    ctx.fill();
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-78, -6);
    ctx.lineTo(-72, 16);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (action === "sort") {
    // Kedua tangan Rani bergerak aktif memilah ke Baki Kiri (Regrowing) & Baki Kanan (Kompos)
    const wave = Math.sin(time * 4.5);
    drawArm(
      ctx,
      x - 46,
      shoulderY,
      360 + wave * 18,
      y - 62 - Math.abs(wave) * 16,
    );
    drawArm(
      ctx,
      x + 46,
      shoulderY,
      690 - wave * 18,
      y - 62 - Math.abs(wave) * 16,
    );
  } else if (action === "regrow") {
    // Tangan Rani memasukkan pangkal daun bawang & selada ke gelas air
    const dip = Math.sin(time * 3.5) * 12;
    drawArm(ctx, x - 44, shoulderY, 1175, y - 110 + dip);
    drawArm(ctx, x + 44, shoulderY, 1315, y - 110 - dip);
  } else if (action === "compost") {
    // Tangan Rani menuang sisa kulit buah ke bak kompos
    const drop = Math.sin(time * 4) * 10;
    drawArm(ctx, x - 42, shoulderY, 1465, y - 155 + drop);
    drawArm(ctx, x + 42, shoulderY, 1525, y - 155 - drop);
  } else if (action === "water") {
    // Tangan Rani memegang gembor penyiram biru & menyiram pot!
    const pourX = x + 85;
    const pourY = y - 245 + Math.sin(time * 2.5) * 8;
    drawArm(ctx, x - 44, shoulderY, x + 28, pourY + 26);
    drawArm(ctx, x + 44, shoulderY, pourX - 18, pourY + 12);

    // Gembor penyiram tanaman biru cerah
    ctx.save();
    ctx.translate(pourX, pourY);
    ctx.rotate(0.32);
    ctx.fillStyle = "#0284C7";
    drawRoundedRect(ctx, -38, -28, 72, 56, 12);
    ctx.fill();
    // Gagang gembor
    ctx.strokeStyle = "#0369A1";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(-34, 0, 22, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    // Moncong penyiram
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(86, -24);
    ctx.lineTo(94, -8);
    ctx.lineTo(32, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (action === "harvest") {
    // Tangan Rani menggunting sayur segar & memasukkannya ke keranjang panen!
    const snip = Math.sin(time * 6) * 14;
    drawArm(ctx, x - 44, shoulderY, 2005, y - 150 + snip);
    drawArm(ctx, x + 44, shoulderY, 2135, y - 145 - snip);

    // Gunting kebun di tangan kanan
    ctx.save();
    ctx.translate(2135, y - 145 - snip);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-34, -14 + Math.abs(snip) * 0.5);
    ctx.moveTo(0, 0);
    ctx.lineTo(-34, 14 - Math.abs(snip) * 0.5);
    ctx.stroke();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(10, -8, 8, 0, Math.PI * 2);
    ctx.arc(10, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (action === "cook") {
    // Rani mengaduk tumisan sayur segar di wajan pakai spatula kayu!
    const stir = Math.sin(time * 5.5) * 22;
    drawArm(ctx, x - 44, shoulderY, 470, y - 55);
    drawArm(ctx, x + 44, shoulderY, 745 + stir, y - 115);

    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(745 + stir, y - 115);
    ctx.lineTo(758 + stir * 0.4, y - 82);
    ctx.stroke();
  } else if (action === "serve") {
    // Rani dengan bangga menyajikan mangkuk hidangan hangat!
    drawArm(ctx, x - 44, shoulderY, 420, y - 54);
    drawArm(ctx, x + 44, shoulderY, 645, y - 75);
  }

  ctx.restore();
}

function drawArm(ctx, sx, sy, hx, hy) {
  // Lengan baju krem + lengan kulit + telapak tangan bulat
  ctx.strokeStyle = "#F2C19B";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo((sx + hx) / 2, Math.max(sy, hy) + 26, hx, hy);
  ctx.stroke();

  ctx.fillStyle = "#F7C9A6";
  ctx.beginPath();
  ctx.arc(hx, hy, 15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFoodLoopScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);
  const rani = getRaniState(time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Bersambung: Dapur Hangat -> Teras Jendela -> Kebun Rumah Cerah
  drawContinuousHomeAndGarden(ctx, time);

  // 2. Rani berdiri di belakang meja/rak/pot (depth layering natural!)
  drawRaniBody(ctx, rani, time);

  // 3. ZONA 1 (x = 540): Dapur — Scene 1 (Sampah), Scene 2 (Pilahan), & Scene 6 (Masak Kembali!)
  drawKitchenZone(ctx, time);

  // 4. ZONA 2 (x = 1340): Meja Solusi — Scene 3 (Regrowing di Gelas Air & Bak Kompos Organik)
  drawRegrowAndCompostZone(ctx, time);

  // 5. ZONA 3 (x = 2080): Kebun Pot Rumah — Scene 4 (Tumbuh Subur) & Scene 5 (Panen ke Keranjang)
  drawGardenAndHarvestZone(ctx, time, rani);

  // 6. Tangan & Alat Kerja Rani di lapisan depan (pisau, gembor air, gunting panen, spatula)
  drawRaniForegroundHands(ctx, rani, time);

  ctx.restore();

  // 7. Overlay Minimalis (Hook awal + CTA Follow akhir di 66.8s)
  if (time < 4.5) {
    drawFoodLoopHook(ctx, time, width, height);
  }
  if (time >= 66.6) {
    const pop = progress(time, 66.8, 67.4, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawContinuousHomeAndGarden(ctx, time) {
  // Dinding Dapur & Teras (x = -300 .. 1680)
  const wallG = ctx.createLinearGradient(0, 0, 0, COUNTER_Y + 500);
  wallG.addColorStop(0, "#FDF8EE");
  wallG.addColorStop(1, "#F3E6D0");
  ctx.fillStyle = wallG;
  ctx.fillRect(-300, -100, 1980, 2100);

  // Backsplash keramik putih-hijau lembut di dinding dapur
  ctx.fillStyle = "#E6F4EA";
  ctx.fillRect(60, 680, 960, 400);
  ctx.strokeStyle = "rgba(22, 163, 74, 0.14)";
  ctx.lineWidth = 2;
  for (let x = 60; x <= 1020; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 680);
    ctx.lineTo(x, 1080);
    ctx.stroke();
  }
  for (let y = 680; y <= 1080; y += 60) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(1020, y);
    ctx.stroke();
  }

  // Rak bumbu dapur di kiri atas (tidak menutupi kepala Rani)
  ctx.fillStyle = "#92400E";
  drawRoundedRect(ctx, 110, 745, 210, 14, 5);
  ctx.fill();
  ctx.fillStyle = "#EF4444";
  drawRoundedRect(ctx, 130, 700, 32, 45, 6);
  ctx.fill();
  ctx.fillStyle = "#F59E0B";
  drawRoundedRect(ctx, 178, 708, 32, 37, 6);
  ctx.fill();
  ctx.fillStyle = "#22C55E";
  drawRoundedRect(ctx, 226, 695, 32, 50, 6);
  ctx.fill();

  // Jendela terang di Zona 2 (Teras/Meja Regrowing x = 1080..1600)
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, 1110, 460, 460, 380, 18);
  ctx.fill();
  ctx.strokeStyle = "#92400E";
  ctx.lineWidth = 14;
  ctx.stroke();

  // Langit cerah & Taman Rumah di Zona 3 (x = 1680 .. 2900)
  const skyG = ctx.createLinearGradient(0, -100, 0, COUNTER_Y);
  skyG.addColorStop(0, "#7DD3FC");
  skyG.addColorStop(0.65, "#BAE6FD");
  skyG.addColorStop(1, "#FEF9C3");
  ctx.fillStyle = skyG;
  ctx.fillRect(1680, -100, 1300, COUNTER_Y + 120);

  // Matahari pagi menyinari kebun pot
  const sunG = ctx.createRadialGradient(2410, 420, 20, 2410, 420, 180);
  sunG.addColorStop(0, "rgba(255, 248, 200, 0.95)");
  sunG.addColorStop(1, "rgba(255, 240, 160, 0)");
  ctx.fillStyle = sunG;
  ctx.beginPath();
  ctx.arc(2410, 420, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(2410, 420, 58, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(ctx, 1820 + Math.sin(time * 0.25) * 30, 340, 0.9, "#FFFFFF", 0.85);

  // Pagar kayu taman di belakang kebun
  ctx.fillStyle = "#D9A066";
  for (let fx = 1710; fx < 2600; fx += 58) {
    drawRoundedRect(ctx, fx, 780, 44, 310, 8);
    ctx.fill();
  }
  ctx.fillStyle = "#B87E45";
  ctx.fillRect(1680, 855, 950, 20);
  ctx.fillRect(1680, 995, 950, 20);

  // Hamparan rumput kebun di bawah (Zona 3)
  ctx.fillStyle = "#65A30D";
  ctx.fillRect(1680, COUNTER_Y - 10, 1300, 900);
}

/**
 * ZONA 1 (x = 540): DAPUR RUMAH
 */
function drawKitchenZone(ctx, time) {
  const isBackToKitchen = time >= 56.6;
  const sortMode =
    progress(time, 14.8, 16.0, easeOutBack) * (1 - progress(time, 24.2, 25.0));

  // Meja Dapur Kayu & Kabinet Bawah
  ctx.fillStyle = "#B47B46";
  ctx.fillRect(-100, COUNTER_Y, 1180, 46);
  ctx.fillStyle = "#D6A874";
  ctx.fillRect(-100, COUNTER_Y + 46, 1180, 440);

  // Kompor di sisi kanan meja dapur (x = 760)
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, 640, COUNTER_Y - 34, 240, 34, 8);
  ctx.fill();

  // --- SCENE 1 (0 - 12s): Talenan & Tempat Sampah Penuh Limbah ---
  if (!isBackToKitchen) {
    // Talenan kayu di kiri meja
    ctx.fillStyle = "#D97706";
    drawRoundedRect(ctx, 160, COUNTER_Y - 18, 250, 18, 6);
    ctx.fill();

    // Tempat sampah terbuka di bawah meja (x = 560, y = COUNTER_Y + 145)
    const binX = 560;
    const binY = COUNTER_Y + 145;
    ctx.fillStyle = "#475569";
    drawRoundedRect(ctx, binX - 95, binY - 45, 190, 210, 16);
    ctx.fill();
    ctx.fillStyle = "#1E293B";
    drawRoundedRect(ctx, binX - 80, binY - 30, 160, 180, 10);
    ctx.fill();

    // Sisa sayuran disapu Rani jatuh ke tempat sampah di Scene 1 (0 - 14.2s)
    if (time < 14.2) {
      const scraps = ["leaf", "carrot", "apple", "watermelon", "banana"];
      scraps.forEach((type, idx) => {
        const cyc = (time * 0.45 + idx * 0.21) % 1;
        const sx = lerp(355, binX + (idx - 2) * 24, cyc);
        const sy = lerp(COUNTER_Y - 30, binY + 105 - idx * 14, cyc * cyc);
        drawScrap(ctx, type, sx, sy, cyc * 3 + idx, 0.95);
      });
    }
  }

  // --- SCENE 2 (12 - 21s): Pemilahan 2 Baki di Meja Dapur ---
  if (sortMode > 0.02) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, sortMode);

    // Baki Kiri: BISA DITANAM ULANG (Regrowing)
    ctx.fillStyle = "#DCFCE7";
    drawRoundedRect(ctx, 175, COUNTER_Y - 102, 320, 102, 20);
    ctx.fill();
    ctx.strokeStyle = "#16A34A";
    ctx.lineWidth = 5;
    ctx.stroke();
    drawScallionRoot(ctx, 265, COUNTER_Y - 46, 0.22);
    drawLettuceBase(ctx, 395, COUNTER_Y - 38, 0.18);
    drawAutoPill(
      ctx,
      335,
      COUNTER_Y + 82,
      "🌱 REGROWING",
      "900 22px Arial, sans-serif",
      "#16A34A",
      "#FFFFFF",
      null,
      44,
    );

    // Baki Kanan: JADI KOMPOS ORGANIK
    ctx.fillStyle = "#FEF3C7";
    drawRoundedRect(ctx, 565, COUNTER_Y - 102, 320, 102, 20);
    ctx.fill();
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 5;
    ctx.stroke();
    drawScrap(ctx, "apple", 655, COUNTER_Y - 52, -0.3, 0.9);
    drawScrap(ctx, "banana", 735, COUNTER_Y - 48, 0.2, 0.9);
    drawScrap(ctx, "carrot", 810, COUNTER_Y - 50, 0.5, 0.9);
    drawAutoPill(
      ctx,
      725,
      COUNTER_Y + 82,
      "♻️ KOMPOS ORGANIK",
      "900 22px Arial, sans-serif",
      "#B45309",
      "#FFFFFF",
      null,
      44,
    );
    ctx.restore();
  }

  // --- SCENE 6 (57 - 70s): KEMBALI KE DAPUR — Rani Memasak Hasil Panen & Hidangan Keluarga! ---
  if (isBackToKitchen) {
    const cookReveal = progress(time, 57.2, 58.6, easeOutBack);

    // Api biru menyala di kompor + wajan berisi sayuran segar + uap harum!
    drawBlueFlame(ctx, 760, COUNTER_Y - 34, Math.min(1, cookReveal), time);

    ctx.fillStyle = "#1E293B";
    drawRoundedRect(ctx, 680, COUNTER_Y - 82, 160, 26, 8);
    ctx.fill();
    ctx.fillRect(840, COUNTER_Y - 76, 66, 10);

    // Sayuran hijau segar di wajan
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.arc(725, COUNTER_Y - 88, 16, 0, Math.PI * 2);
    ctx.arc(760, COUNTER_Y - 94, 18, 0, Math.PI * 2);
    ctx.arc(795, COUNTER_Y - 88, 15, 0, Math.PI * 2);
    ctx.fill();

    // Uap masakan hangat naik
    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const uy = (time * 42 + i * 26) % 75;
      ctx.beginPath();
      ctx.arc(728 + i * 32, COUNTER_Y - 115 - uy, 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mangkuk hidangan hangat siap saji di meja kiri (x = 340)
    ctx.save();
    ctx.translate(340, COUNTER_Y - 10);
    ctx.scale(clamp(cookReveal, 0.01, 1.04), clamp(cookReveal, 0.01, 1.04));
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, -28, 86, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 4;
    ctx.stroke();
    // Salad/sup sayur segar di mangkuk
    ctx.fillStyle = "#4ADE80";
    ctx.beginPath();
    ctx.ellipse(0, -30, 74, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(-24, -34, 10, 0, Math.PI * 2);
    ctx.arc(28, -32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Badge Siklus Hijau di atas dapur (62.0s - 66.5s)
    if (time >= 62.0 && time < 66.6) {
      const loopA =
        progress(time, 62.0, 62.7) * (1 - progress(time, 65.9, 66.6));
      ctx.save();
      ctx.globalAlpha = loopA;
      drawAutoPill(
        ctx,
        540,
        575,
        "♻️ SIKLUS DAPUR → KEBUN → DAPUR",
        "900 28px Arial, sans-serif",
        "rgba(22, 163, 74, 0.92)",
        "#FFFFFF",
        "#86EFAC",
        60,
      );
      ctx.restore();
    }
  }
}

/**
 * ZONA 2 (x = 1340): SCENE 3 — Regrowing di Gelas Air & Kompos Organik
 */
function drawRegrowAndCompostZone(ctx, time) {
  // Meja kayu dekat jendela
  ctx.fillStyle = "#A16207";
  drawRoundedRect(ctx, 1060, COUNTER_Y, 580, 42, 10);
  ctx.fill();

  const regrowProg = progress(time, 25.0, 32.0, easeOutCubic);
  const compostProg = progress(time, 30.3, 35.8, easeInOutCubic);

  // 1. Gelas kaca Regrowing Daun Bawang (x = 1170) & Selada (x = 1315)
  drawRegrowJar(ctx, 1170, COUNTER_Y, (x, y) =>
    drawScallionRoot(ctx, x, y, regrowProg),
  );
  drawRegrowJar(ctx, 1315, COUNTER_Y, (x, y) =>
    drawLettuceBase(ctx, x, y, regrowProg),
  );
  drawAutoPill(
    ctx,
    1242,
    COUNTER_Y + 95,
    "METODE REGROWING",
    "900 22px Arial, sans-serif",
    "#16A34A",
    "#FFFFFF",
    null,
    44,
  );

  // 2. Wadah Kompos Organik (x = 1510): sisa buah/sayur berubah jadi tanah humus subur!
  const cx = 1510;
  const cy = COUNTER_Y;
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, cx - 82, cy - 170, 164, 170, 18);
  ctx.fill();
  ctx.fillStyle = lerpColor("#785A3A", "#3B2314", compostProg);
  drawRoundedRect(ctx, cx - 68, cy - 125, 136, 112, 10);
  ctx.fill();

  if (compostProg < 0.85) {
    ctx.save();
    ctx.globalAlpha = 1 - compostProg;
    drawScrap(ctx, "apple", cx - 26, cy - 88, 0.2, 0.75);
    drawScrap(ctx, "banana", cx + 22, cy - 72, -0.3, 0.75);
    ctx.restore();
  } else {
    ctx.fillStyle = "#FDE047";
    for (let s = 0; s < 4; s++) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(time * 5 + s));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(cx - 40 + s * 28, cy - 140 - (s % 2) * 16, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawAutoPill(
    ctx,
    cx,
    COUNTER_Y + 95,
    "KOMPOS ORGANIK",
    "900 22px Arial, sans-serif",
    "#B45309",
    "#FFFFFF",
    null,
    44,
  );
}

function drawRegrowJar(ctx, cx, baseY, drawPlant) {
  ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
  drawRoundedRect(ctx, cx - 44, baseY - 76, 88, 72, 10);
  ctx.fill();
  drawPlant(cx, baseY - 52);
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, cx - 48, baseY - 125, 96, 125, 12);
  ctx.stroke();
}

function drawScallionRoot(ctx, cx, cy, grow) {
  ctx.strokeStyle = "#F8FAFC";
  ctx.lineWidth = 2.5;
  const rootLen = 12 + grow * 28;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 5, cy + 16);
    ctx.lineTo(cx + i * 9, cy + 16 + rootLen);
    ctx.stroke();
  }
  ctx.fillStyle = "#F1F5F9";
  drawRoundedRect(ctx, cx - 12, cy - 18, 24, 38, 6);
  ctx.fill();
  const shootH = 22 + grow * 115;
  ctx.fillStyle = "#22C55E";
  drawRoundedRect(ctx, cx - 10, cy - 18 - shootH, 9, shootH, 4);
  ctx.fill();
  ctx.fillStyle = "#4ADE80";
  drawRoundedRect(ctx, cx + 1, cy - 18 - shootH * 0.85, 9, shootH * 0.85, 4);
  ctx.fill();
}

function drawLettuceBase(ctx, cx, cy, grow) {
  ctx.fillStyle = "#DCFCE7";
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 22, 0, Math.PI * 2);
  ctx.fill();
  const r = 18 + grow * 34;
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.arc(
    cx - 18 * (0.5 + grow * 0.5),
    cy - 12 - grow * 28,
    r * 0.75,
    0,
    Math.PI * 2,
  );
  ctx.arc(
    cx + 18 * (0.5 + grow * 0.5),
    cy - 12 - grow * 28,
    r * 0.75,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = "#4ADE80";
  ctx.beginPath();
  ctx.arc(cx, cy - 18 - grow * 36, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * ZONA 3 (x = 2080): SCENE 4 (Pertumbuhan di Pot) & SCENE 5 (Panen ke Keranjang!)
 */
function drawGardenAndHarvestZone(ctx, time, rani) {
  const grow = progress(time, 36.8, 46.2, easeOutCubic);
  const harvestProg = progress(time, 47.0, 55.0, easeInOutCubic);

  // Rak / Meja Kebun Pot
  ctx.fillStyle = "#854D0E";
  drawRoundedRect(ctx, 1780, COUNTER_Y, 620, 36, 10);
  ctx.fill();

  const pots = [
    { x: 1895, type: "scallion" },
    { x: 2075, type: "lettuce" },
    { x: 2255, type: "scallion" },
  ];

  for (const p of pots) {
    ctx.fillStyle = "#C2410C";
    ctx.beginPath();
    ctx.moveTo(p.x - 62, COUNTER_Y - 108);
    ctx.lineTo(p.x + 62, COUNTER_Y - 108);
    ctx.lineTo(p.x + 48, COUNTER_Y);
    ctx.lineTo(p.x - 48, COUNTER_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#EA580C";
    drawRoundedRect(ctx, p.x - 68, COUNTER_Y - 122, 136, 20, 6);
    ctx.fill();

    ctx.fillStyle = "#3B2314";
    ctx.beginPath();
    ctx.ellipse(p.x, COUNTER_Y - 118, 56, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const plantScale = 1 - harvestProg * 0.28;
    ctx.save();
    ctx.translate(p.x, COUNTER_Y - 120);
    ctx.scale(1, plantScale);
    if (p.type === "scallion") {
      drawScallionRoot(ctx, 0, 0, 0.25 + grow * 0.95);
    } else {
      drawLettuceBase(ctx, 0, -4, 0.25 + grow * 1.15);
    }
    ctx.restore();
  }

  // Tetesan air keluar langsung dari moncong gembor Rani di Scene 4 (37.2s - 46.0s)!
  if (time >= 37.2 && time <= 46.0) {
    const spoutX = rani.x + 172;
    const spoutY = COUNTER_Y - 238;
    ctx.fillStyle = "#38BDF8";
    for (let i = 0; i < 10; i++) {
      const cyc = (time * 1.5 + i * 0.17) % 1;
      const wx = spoutX + cyc * 45 + ((i % 3) - 1) * 14 * cyc;
      const wy = lerp(spoutY, COUNTER_Y - 122, cyc * cyc);
      ctx.beginPath();
      ctx.ellipse(wx, wy, 4, 9, 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Keranjang Panen Anyaman muncul penuh sayur segar di Scene 5 (42.5s - 50s)!
  if (harvestProg > 0.05) {
    const bx = 2075;
    const by = COUNTER_Y + 130;
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(
      clamp(harvestProg * 1.3, 0.01, 1),
      clamp(harvestProg * 1.3, 0.01, 1),
    );

    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.arc(-42, -46, 36, 0, Math.PI * 2);
    ctx.arc(0, -56, 40, 0, Math.PI * 2);
    ctx.arc(44, -46, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#B45309";
    drawRoundedRect(ctx, -98, -44, 196, 92, 22);
    ctx.fill();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 4;
    ctx.strokeRect(-86, -24, 172, 18);
    ctx.strokeRect(-86, 8, 172, 18);

    ctx.fillStyle = "#FEF08A";
    ctx.font = "900 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ PANEN SEGAR!", 0, 82);
    ctx.restore();
  }
}

function drawFoodLoopHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.8, 4.4, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;
  ctx.translate(width / 2, height * 0.21);
  ctx.scale(clamp(enter, 0.01, 1.05), clamp(enter, 0.01, 1.05));

  drawAutoPill(
    ctx,
    0,
    -88,
    "♻️ ZERO WASTE DAPUR",
    "900 34px Arial, sans-serif",
    "#15803D",
    "#FEF08A",
    "#86EFAC",
    70,
  );

  ctx.lineJoin = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
  ctx.font = "900 48px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("LIMBAH DAPUR BISA JADI", 0, 10);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("LIMBAH DAPUR BISA JADI", 0, 10);

  ctx.strokeText("BAHAN MAKANAN LAGI!", 0, 72);
  ctx.fillStyle = "#FFD43B";
  ctx.fillText("BAHAN MAKANAN LAGI!", 0, 72);
  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.25;
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
