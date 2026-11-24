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
import { drawCloud, drawRoundedRect } from "../engine/shapes.js";

/**
 * Film Animasi 1-Shot 3D Stylized Cutaway Diorama (68 Detik):
 * "Kenapa Jalan Aspal Baru Cepat Berlubang Saat Musim Hujan?"
 *
 * Alur 4 Babak (Gaya 3D Clay-Toy Cutaway + Macro Zoom + Solusi Teknis):
 *  - Babak 1 (0.0 - 13.5s) : Kondisi Awal — Jalan baru mulus, mobil melintas lancar, pekerja helm kuning tersenyum ("Awalnya mulus.")
 *  - Babak 2 (13.5 - 32.5s): Macro Zoom Penyebab — Hujan turun, air menyusup lewat retakan rambut -> pondasi batu & tanah melunak membentuk rongga kosong!
 *  - Babak 3 (32.5 - 45.5s): Dampak Nyata — Truk berat melintas menekan titik lemah -> KRAK! Aspal ambles jadi lubang berisi genangan air!
 *  - Babak 4 (45.5 - 68.0s): Solusi Teknis — Pondasi dipadatkan + Drainase tepi + Lapisan Tack Coat & Aspal kedap air -> Hujan & truk lewat tetap awet + "+ FOLLOW"
 */

const ROAD_Y = 930;
const ASPHALT_H = 88;
const GRAVEL_Y = ROAD_Y + ASPHALT_H; // 1018
const GRAVEL_H = 165;
const SOIL_Y = GRAVEL_Y + GRAVEL_H; // 1183

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 920, zoom: 1.0 }, // Babak 1 (0-10.2s): Wide Cutaway Jalan Baru Mulus
  { time: 10.0, x: 540, y: 920, zoom: 1.0 },
  { time: 11.6, x: 540, y: 1045, zoom: 2.08, ease: easeInOutCubic }, // Babak 2 (10.3-28.9s): Macro Zoom retakan & resapan air
  { time: 28.4, x: 540, y: 1065, zoom: 2.08 },
  { time: 29.8, x: 540, y: 960, zoom: 1.24, ease: easeInOutCubic }, // Babak 3 (29.0-37.9s): Truk berat -> KRAK! Lubang
  { time: 37.6, x: 540, y: 960, zoom: 1.24 },
  { time: 39.2, x: 580, y: 990, zoom: 1.32, ease: easeInOutCubic }, // Babak 4A (38.0-49.2s): Pemadatan + Drainase + Sealcoat
  { time: 50.8, x: 540, y: 920, zoom: 1.0, ease: easeInOutCubic }, // Babak 4B (49.3-61.0s): Wide uji hujan & truk -> tetap mulus!
  { time: 61.0, x: 540, y: 920, zoom: 1.0 },
];

// Batu kerikil deterministik di lapisan pondasi (Base Course)
const GRAVEL_STONES = Array.from({ length: 42 }, (_, i) => ({
  x: 65 + (i % 14) * 72 + ((i * 19) % 24) - 12,
  y: GRAVEL_Y + 24 + Math.floor(i / 14) * 48 + ((i * 13) % 16) - 8,
  rx: 18 + (i % 4) * 5,
  ry: 12 + (i % 3) * 4,
  shade: i % 3 === 0 ? "#94A3B8" : i % 3 === 1 ? "#64748B" : "#CBD5E1",
}));

function drawAutoPill(
  ctx,
  cx,
  cy,
  text,
  font,
  bgColor,
  textColor,
  borderColor = null,
  h = 52,
) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(190, ctx.measureText(text).width + 44);
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 16);
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3.5;
    drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 16);
    ctx.stroke();
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

export function drawAsphaltPotholeScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar 3D Stylized Daylight (berubah agak mendung saat hujan turun!)
  const rainIntensity =
    progress(time, 10.5, 12.2) * (1 - progress(time, 38.0, 39.6)) +
    progress(time, 49.5, 51.0);
  drawStylizedRoadBackdrop(ctx, time, clamp(rainIntensity, 0, 1));

  // 2. Potongan Melintang 3 Lapisan Jalan (Aspal -> Batu Pondasi -> Tanah) + Retakan + Rongga + Lubang + Drainase!
  drawRoadCutawayLayers(ctx, time, clamp(rainIntensity, 0, 1));

  // 3. Kendaraan Melintas (Mobil merah di Babak 1 & Truk berat di Babak 3 & 4B)
  drawVehicles(ctx, time);

  // 4. Karakter Pekerja 3D Helm Kuning (memantau, kaget, lalu memperbaiki dengan pemadat & drainase!)
  drawRoadWorker3D(ctx, time);

  // 5. Hujan Rintik 3D di lapisan depan
  if (rainIntensity > 0.05) {
    drawRainOverlay(ctx, time, clamp(rainIntensity, 0, 1));
  }

  ctx.restore();

  // 6. Pill Status Screen-Space di langit atas (aman 100%, tidak pernah bertabrakan dengan subtitle bawah!)
  if (time >= 13.0 && time <= 21.0) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.17,
      "🔍 RETAKAN RAMBUT ASPAL",
      "900 28px Arial, sans-serif",
      "rgba(15, 23, 42, 0.9)",
      "#FDE047",
      "#38BDF8",
      56,
    );
  } else if (time >= 21.2 && time <= 29.0) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.17,
      "💧 PONDASI MELUNAK & BERONGGA",
      "900 28px Arial, sans-serif",
      "rgba(185, 28, 28, 0.94)",
      "#FFFFFF",
      "#FCA5A5",
      56,
    );
  } else if (time >= 45.0 && time <= 51.0) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.17,
      "🛡️ SEALCOAT KEDAP AIR + DRAINASE",
      "900 28px Arial, sans-serif",
      "rgba(13, 148, 136, 0.94)",
      "#FFFFFF",
      "#99F6E4",
      56,
    );
  }

  // 7. CTA Follow di akhir
  if (time >= 57.5) {
    const pop = progress(time, 57.7, 58.3, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawStylizedRoadBackdrop(ctx, time, rainIntensity) {
  // Langit cerah berubah sedikit kelabu saat hujan
  const skyG = ctx.createLinearGradient(0, -150, 0, ROAD_Y);
  skyG.addColorStop(0, lerpColor("#5CA9F2", "#475569", rainIntensity * 0.72));
  skyG.addColorStop(
    0.65,
    lerpColor("#A5D8FF", "#94A3B8", rainIntensity * 0.72),
  );
  skyG.addColorStop(1, lerpColor("#E0F2FE", "#CBD5E1", rainIntensity * 0.65));
  ctx.fillStyle = skyG;
  ctx.fillRect(-300, -180, 1700, ROAD_Y + 200);

  // Awan (putih cerah -> abu mendung saat hujan)
  const cloudCol = lerpColor("#FFFFFF", "#64748B", rainIntensity * 0.8);
  drawCloud(ctx, 250 + Math.sin(time * 0.3) * 26, 440, 1.05, cloudCol, 0.9);
  drawCloud(
    ctx,
    790 + Math.sin(time * 0.25 + 1.4) * 22,
    410,
    1.15,
    cloudCol,
    0.88,
  );

  // Perbukitan hijau lembut + pohon kelapa di kejauhan (ikonik gaya referensi!)
  ctx.fillStyle = lerpColor("#A3E69A", "#6B9F66", rainIntensity * 0.5);
  ctx.fillRect(-300, 680, 1700, 260);
  ctx.fillStyle = lerpColor("#6EC462", "#4B8644", rainIntensity * 0.5);
  ctx.fillRect(-300, 790, 1700, 160);

  // Pohon kelapa bergoyang di latar kiri
  const sway =
    Math.sin(time * (1.2 + rainIntensity * 2)) * (7 + rainIntensity * 6);
  ctx.strokeStyle = "#8D6239";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(190, 860);
  ctx.quadraticCurveTo(210, 710, 235 + sway * 0.5, 580);
  ctx.stroke();

  const topX = 235 + sway * 0.5;
  const topY = 580;
  for (const ang of [-2.5, -1.9, -1.1, -0.4, 0.3, 0.9]) {
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(ang + sway * 0.01);
    ctx.fillStyle = "#2E8B3B";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(64, -30, 130, 14);
    ctx.quadraticCurveTo(64, -5, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawRoadCutawayLayers(ctx, time, rainIntensity) {
  // Fase kerusakan vs perbaikan (sinkron presisi dengan voiceover 61 detik!)
  const crackProg =
    progress(time, 12.8, 16.0, easeOutCubic) *
    (1 - progress(time, 45.0, 47.0, easeInOutCubic));
  const seepProg =
    progress(time, 15.0, 27.5, easeInOutCubic) *
    (1 - progress(time, 41.0, 44.0, easeInOutCubic));
  const potholeProg =
    progress(time, 31.8, 33.2, easeOutCubic) *
    (1 - progress(time, 41.5, 45.0, easeInOutCubic));
  const drainProg = progress(time, 45.0, 48.0, easeOutBack);
  const sealProg = progress(time, 46.5, 49.5, easeOutCubic);

  // 1. LAPISAN BAWAH: TANAH DASAR (Subgrade Soil)
  const soilG = ctx.createLinearGradient(0, SOIL_Y, 0, 1850);
  soilG.addColorStop(0, lerpColor("#78502C", "#3E2717", seepProg * 0.8));
  soilG.addColorStop(1, "#2A1B10");
  ctx.fillStyle = soilG;
  ctx.fillRect(-200, SOIL_Y, 1500, 780);

  // Area tanah melunak/berlumpur di bawah titik retak (x = 540)
  if (seepProg > 0.05) {
    const mudG = ctx.createRadialGradient(
      540,
      SOIL_Y + 35,
      18,
      540,
      SOIL_Y + 45,
      220 * seepProg,
    );
    mudG.addColorStop(0, "rgba(14, 116, 144, 0.72)");
    mudG.addColorStop(0.55, "rgba(30, 58, 95, 0.55)");
    mudG.addColorStop(1, "rgba(42, 27, 16, 0)");
    ctx.fillStyle = mudG;
    ctx.beginPath();
    ctx.arc(540, SOIL_Y + 40, 220 * seepProg, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. LAPISAN TENGAH: BATU PONDASI / AGREGAT (Base Course)
  ctx.fillStyle = lerpColor("#78716C", "#475569", seepProg * 0.55);
  ctx.fillRect(-200, GRAVEL_Y, 1500, GRAVEL_H);
  for (const st of GRAVEL_STONES) {
    // Jika lubang terbentuk, batu di tengah agak turun/tergerus
    const inPit = Math.abs(st.x - 540) < 115;
    const drop = inPit ? potholeProg * 36 : 0;
    ctx.fillStyle = st.shade;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y + drop, st.rx, st.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rongga kosong (void) tergerus air di bawah aspal (muncul di akhir Babak 2 & Babak 3!)
  if (seepProg > 0.45 && potholeProg < 0.7) {
    const voidA = progress(time, 25.0, 30.0) * (1 - potholeProg);
    ctx.fillStyle = `rgba(15, 23, 42, ${voidA * 0.85})`;
    ctx.beginPath();
    ctx.ellipse(
      540,
      GRAVEL_Y + 36,
      115 * seepProg,
      42 * seepProg,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 3. LAPISAN ATAS: ASPAL (Asphalt Surface — penuh ujung ke ujung!)
  const aspG = ctx.createLinearGradient(0, ROAD_Y, 0, GRAVEL_Y);
  aspG.addColorStop(0, "#334155");
  aspG.addColorStop(0.25, "#1E293B");
  aspG.addColorStop(1, "#0F172A");
  ctx.fillStyle = aspG;
  ctx.fillRect(-200, ROAD_Y, 1500, ASPHALT_H);

  // Marka jalan kuning putus-putus penuh ujung ke ujung di permukaan atas aspal
  ctx.fillStyle = "#FACC15";
  for (let mx = -140; mx < 1240; mx += 140) {
    if (potholeProg > 0.2 && mx > 420 && mx < 640) continue;
    drawRoundedRect(ctx, mx, ROAD_Y + 10, 74, 10, 4);
    ctx.fill();
  }

  // 4. RETAKAN RAMBUT & TETESAN AIR MENYUSUP (Babak 2)
  if (crackProg > 0.02 && potholeProg < 0.3) {
    ctx.save();
    ctx.strokeStyle = "#020617";
    ctx.lineWidth = 4 + crackProg * 3;
    ctx.beginPath();
    ctx.moveTo(540, ROAD_Y);
    ctx.lineTo(532, ROAD_Y + 26 * crackProg);
    ctx.lineTo(548, ROAD_Y + 54 * crackProg);
    ctx.lineTo(538, ROAD_Y + ASPHALT_H * crackProg);
    ctx.stroke();

    // Tetesan air 3D biru mengilap merembes turun lewat retakan ke pondasi!
    if (seepProg > 0.05) {
      for (let d = 0; d < 7; d++) {
        const cyc = (time * 0.7 + d * 0.16) % 1;
        const dx = 540 + Math.sin(cyc * 9 + d) * 28 * cyc;
        const dy = lerp(ROAD_Y + 4, SOIL_Y + 35, cyc);
        const dg = ctx.createRadialGradient(dx - 2, dy - 2, 1, dx, dy, 7);
        dg.addColorStop(0, "#E0F2FE");
        dg.addColorStop(0.5, "#38BDF8");
        dg.addColorStop(1, "#0284C7");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(dx, dy, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 5. LUBANG JALAN AMBLES BERISI GENANGAN AIR (Babak 3: 35.4s - 49s)
  if (potholeProg > 0.05) {
    ctx.save();
    // Cekungan lubang memotong aspal & sebagian pondasi
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.moveTo(410, ROAD_Y);
    ctx.lineTo(445, ROAD_Y + 95 * potholeProg);
    ctx.lineTo(540, ROAD_Y + 122 * potholeProg);
    ctx.lineTo(635, ROAD_Y + 92 * potholeProg);
    ctx.lineTo(670, ROAD_Y);
    ctx.closePath();
    ctx.fill();

    // Genangan air keruh di dalam lubang!
    ctx.fillStyle = "rgba(56, 189, 248, 0.72)";
    ctx.beginPath();
    ctx.moveTo(426, ROAD_Y + 34 * potholeProg);
    ctx.lineTo(448, ROAD_Y + 95 * potholeProg);
    ctx.lineTo(540, ROAD_Y + 118 * potholeProg);
    ctx.lineTo(632, ROAD_Y + 92 * potholeProg);
    ctx.lineTo(654, ROAD_Y + 34 * potholeProg);
    ctx.closePath();
    ctx.fill();

    // Pecahan bongkahan aspal di dasar lubang
    ctx.fillStyle = "#0F172A";
    drawRoundedRect(ctx, 470, ROAD_Y + 86 * potholeProg, 42, 18, 4);
    ctx.fill();
    drawRoundedRect(ctx, 560, ROAD_Y + 90 * potholeProg, 46, 16, 4);
    ctx.fill();
    ctx.restore();
  }

  // 6. SOLUSI (Babak 4): Lapisan Tack Coat + Sealcoat Kedap Air & Drainase Beton Tepi Jalan!
  if (sealProg > 0.02) {
    const sw = 1080 * sealProg;
    // Lapisan Tack Coat oranye-kuning perekat anti-air di bawah aspal baru
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(-150, GRAVEL_Y - 10, sw, 10);
    // Lapisan Sealcoat biru-kilau kedap air di permukaan atas aspal
    ctx.fillStyle = "#0D9488";
    ctx.fillRect(-150, ROAD_Y - 8, sw, 10);
  }

  // Saluran Drainase Beton U-Ditch di sisi kanan jalan (x = 925 .. 1040)
  if (drainProg > 0.02) {
    ctx.save();
    ctx.translate(980, ROAD_Y + 90);
    ctx.scale(clamp(drainProg, 0.01, 1.04), clamp(drainProg, 0.01, 1.04));
    ctx.fillStyle = "#94A3B8";
    drawRoundedRect(ctx, -60, -90, 120, 175, 10);
    ctx.fill();
    ctx.fillStyle = "#1E293B";
    drawRoundedRect(ctx, -40, -76, 80, 140, 6);
    ctx.fill();
    // Air hujan mengalir aman ke dalam drainase saat hujan Babak 4B!
    if (rainIntensity > 0.1 && time > 58.5) {
      ctx.fillStyle = "#38BDF8";
      drawRoundedRect(ctx, -38, 12, 76, 50, 4);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Mobil Merah (Babak 1) & Truk Muatan Berat (Babak 3 & Babak 4B)
 */
function drawVehicles(ctx, time) {
  // Babak 1 (0.8s - 8.5s): Mobil merah melintas mulus di jalan baru
  if (time >= 0.8 && time <= 8.8) {
    const p = progress(time, 0.8, 8.5);
    const cx = lerp(-180, 1240, p);
    drawCar3D(ctx, cx, ROAD_Y);
  }

  // Babak 3 (29.0s - 37.8s): Truk berat melintas & menginjak titik lemah tepat di "KRAK!" (31.9s)
  if (time >= 29.0 && time <= 38.0) {
    const p = progress(time, 29.0, 37.8);
    const tx = lerp(-240, 1320, p);
    const hitDip = Math.abs(tx - 540) < 120 ? 14 : 0;
    drawHeavyTruck3D(ctx, tx, ROAD_Y + hitDip, time);
  }

  // Babak 4B (51.5s - 60.5s): Uji truk berat melintas di jalan yang sudah diperbaiki -> mulus!
  if (time >= 51.5 && time <= 60.8) {
    const p = progress(time, 51.5, 60.5);
    const tx = lerp(-240, 1320, p);
    drawHeavyTruck3D(ctx, tx, ROAD_Y, time);
  }
}

function drawCar3D(ctx, cx, roadY) {
  ctx.save();
  ctx.translate(cx, roadY);
  ctx.fillStyle = "#EF4444";
  drawRoundedRect(ctx, -95, -62, 190, 44, 14);
  ctx.fill();
  ctx.fillStyle = "#DC2626";
  drawRoundedRect(ctx, -58, -96, 114, 42, 14);
  ctx.fill();
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, -44, -88, 86, 26, 6);
  ctx.fill();
  for (const wx of [-54, 54]) {
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(wx, -18, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#CBD5E1";
    ctx.beginPath();
    ctx.arc(wx, -18, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeavyTruck3D(ctx, cx, roadY, time) {
  const rumble = Math.sin(time * 24) * 2;
  ctx.save();
  ctx.translate(cx, roadY + rumble);
  // Kontainer belakang
  ctx.fillStyle = "#2563EB";
  drawRoundedRect(ctx, -165, -148, 225, 118, 12);
  ctx.fill();
  ctx.fillStyle = "#1D4ED8";
  ctx.fillRect(-155, -135, 205, 20);
  // Kabin depan
  ctx.fillStyle = "#F59E0B";
  drawRoundedRect(ctx, 64, -108, 84, 78, 12);
  ctx.fill();
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, 88, -96, 50, 36, 6);
  ctx.fill();
  // Roda besar
  for (const wx of [-115, -35, 108]) {
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(wx, -24, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94A3B8";
    ctx.beginPath();
    ctx.arc(wx, -24, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Karakter 3D Minimalis Helm Proyek Kuning (persis gaya referensi!)
 */
function drawRoadWorker3D(ctx, time) {
  let wx = 825;
  let mood = "smile";
  if (time >= 35.5 && time < 45.5) {
    wx = 815;
    mood = "shock";
  } else if (time >= 45.5 && time < 57.5) {
    wx =
      lerp(815, 650, progress(time, 45.5, 47.0, easeInOutCubic)) +
      Math.sin(time * 4) * 35;
    mood = "work";
  } else if (time >= 57.5) {
    wx = lerp(650, 825, progress(time, 57.5, 59.0, easeInOutCubic));
    mood = "smile";
  }

  const bob = Math.sin(time * (mood === "work" ? 12 : 3)) * 3;
  ctx.save();
  ctx.translate(wx, ROAD_Y);

  // Bayangan lembut
  ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sepatu & Celana
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, -28, -16, 24, 16, 6);
  ctx.fill();
  drawRoundedRect(ctx, 4, -16, 24, 16, 6);
  ctx.fill();
  ctx.fillStyle = "#1E3A5F";
  drawRoundedRect(ctx, -24, -84, 20, 70, 8);
  ctx.fill();
  drawRoundedRect(ctx, 4, -84, 20, 70, 8);
  ctx.fill();

  // Baju hitam + Rompi proyek oranye tipis
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -38, -172 + bob, 76, 94, 22);
  ctx.fill();
  ctx.fillStyle = "#F97316";
  drawRoundedRect(ctx, -28, -162 + bob, 56, 72, 10);
  ctx.fill();
  ctx.fillStyle = "#FEF08A";
  ctx.fillRect(-28, -118 + bob, 56, 8);

  // Kepala bulat 3D
  const headY = -212 + bob;
  const headG = ctx.createRadialGradient(-10, headY - 10, 6, 0, headY, 40);
  headG.addColorStop(0, "#FDE0C2");
  headG.addColorStop(1, "#D4A373");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, headY, 36, 0, Math.PI * 2);
  ctx.fill();

  // Wajah minimalis imut
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(-11, headY + 2, 3.8, 0, Math.PI * 2);
  ctx.arc(11, headY + 2, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (mood === "shock") {
    ctx.arc(0, headY + 16, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(0, headY + 10, 8, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // Helm proyek kuning 3D
  const helmG = ctx.createRadialGradient(-12, headY - 30, 5, 0, headY - 16, 44);
  helmG.addColorStop(0, "#FDE047");
  helmG.addColorStop(0.65, "#F59E0B");
  helmG.addColorStop(1, "#B45309");
  ctx.fillStyle = helmG;
  ctx.beginPath();
  ctx.arc(0, headY - 12, 40, Math.PI, Math.PI * 2);
  ctx.fill();
  drawRoundedRect(ctx, -48, headY - 16, 96, 10, 5);
  ctx.fill();

  // Mesin Pemadat (Stamper) saat Babak 4A (46s - 56s)
  if (mood === "work") {
    const bounce = Math.abs(Math.sin(time * 22)) * 10;
    ctx.fillStyle = "#DC2626";
    drawRoundedRect(ctx, -84, -95 - bounce, 34, 65, 6);
    ctx.fill();
    ctx.fillStyle = "#475569";
    drawRoundedRect(ctx, -96, -24 - bounce, 58, 22, 4);
    ctx.fill();
  }

  ctx.restore();
}

function drawRainOverlay(ctx, time, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(186, 230, 253, ${0.72 * alpha})`;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 24; i++) {
    const cyc = (time * 1.65 + i * 0.13) % 1;
    const rx = 40 + (i % 12) * 90;
    const ry = lerp(320, ROAD_Y - 6, cyc);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 6, ry + 26);
    ctx.stroke();
  }
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
