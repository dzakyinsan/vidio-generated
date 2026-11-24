import { applyCamera, evaluateCamera } from "../engine/camera.js";
import {
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  progress,
} from "../engine/math.js";
import { drawCloud, drawRoundedRect } from "../engine/shapes.js";

/**
 * Film Animasi 1-Shot Sinematik 7 Adegan Hidup (68 Detik — Berimbang & Faktual):
 * "Polemik Pemindahan Badak Jawa dari Ujung Kulon"
 *
 * 7 Adegan Berkesinambungan (x = 0 .. 4900):
 *  - Adegan 1 (0.0 - 5.2s)  : x=540  — Berita Viral di layar HP melayang di atas Ujung Kulon
 *  - Adegan 2 (5.2 - 14.0s) : x=540  — Induk & Anak Badak Jawa + Polhut mencatat populasi (~80 ekor, 1 lokasi)
 *  - Adegan 3 (14.0 - 21.8s): x=1340 — Peta Pulau Jawa 3D: rute usulan Ujung Kulon -> Alas Purwo (Jatim)
 *  - Adegan 4 (21.8 - 28.0s): x=2120 — Erupsi Gunung Anak Krakatau + gelombang tsunami (alasan mitigasi bencana)
 *  - Adegan 5 (28.0 - 39.0s): x=2900 — Warga & Aktivis menolak + truk angkut & monitor ECG stres badak (kritik pakar)
 *  - Adegan 6 (39.0 - 50.0s): x=3700 — Kaca pembesar memindai Peta Tambang Banten 2026 & cutaway bawah tanah "?"
 *  - Adegan 7 (50.0 - 60.0s): x=4450 — Klarifikasi Resmi di Podium (Stempel "TANPA IZIN TAMBANG DI TNUK" + Kajian Ilmiah)
 *  - Penutup  (60.0 - 68.0s): x=540  — Kembali ke Induk & Anak Badak di Ujung Kulon + 2 opsi diskusi + "+ FOLLOW"
 */

const GROUND_Y = 1150;

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 880, zoom: 0.96 }, // Adegan 1 (0-6.2s): Viral di atas Ujung Kulon
  { time: 6.2, x: 540, y: 940, zoom: 1.04, ease: easeInOutCubic }, // Adegan 2 (6.2-16.4s): Induk & Anak Badak + Polhut
  { time: 15.8, x: 540, y: 950, zoom: 1.1 },
  { time: 17.2, x: 1340, y: 920, zoom: 1.04, ease: easeInOutCubic }, // Adegan 3 (16.5-25.4s): Peta Pulau Jawa (Ujung Kulon -> Alas Purwo)
  { time: 24.8, x: 1340, y: 920, zoom: 1.04 },
  { time: 26.2, x: 2120, y: 920, zoom: 1.08, ease: easeInOutCubic }, // Adegan 4 (25.5-37.6s): Erupsi Anak Krakatau & Tsunami
  { time: 37.0, x: 2120, y: 920, zoom: 1.12 },
  { time: 38.4, x: 2900, y: 950, zoom: 1.02, ease: easeInOutCubic }, // Adegan 5 (37.8-52.8s): Aktivis/Warga + Truk & Monitor Stres Badak
  { time: 52.2, x: 2900, y: 950, zoom: 1.06 },
  { time: 53.6, x: 3700, y: 1030, zoom: 1.06, ease: easeInOutCubic }, // Adegan 6 (53.0-65.8s): Peta Tambang & Cutaway Bawah Tanah
  { time: 65.2, x: 3700, y: 1060, zoom: 1.12 },
  { time: 66.6, x: 4450, y: 930, zoom: 1.04, ease: easeInOutCubic }, // Adegan 7 (66.0-81.8s): Klarifikasi Podium + Stempel + Ilmuwan
  { time: 81.2, x: 4450, y: 930, zoom: 1.04 },
  { time: 82.6, x: 540, y: 930, zoom: 1.0, ease: easeInOutCubic }, // Penutup (82.0-92.0s): Kembali ke Ujung Kulon + 2 Opsi & Follow
  { time: 92.0, x: 540, y: 930, zoom: 1.0 },
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
  h = 54,
) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(190, ctx.measureText(text).width + 46);
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

export function drawJavanRhinoScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Bersambung untuk 7 Adegan (x = -300 .. 5100)
  drawWorldBackdrop(ctx, time);

  // 2. ADEGAN 1 & 2 & PENUTUP (x = 540): Hutan Ujung Kulon, Induk+Anak Badak, Polhut, & Feed Viral
  drawUjungKulonScene(ctx, time);

  // 3. ADEGAN 3 (x = 1340): Peta Pulau Jawa & Rute Usulan ke Alas Purwo
  drawJavaMapScene(ctx, time);

  // 4. ADEGAN 4 (x = 2120): Erupsi Gunung Anak Krakatau & Gelombang Tsunami
  drawKrakatauEruptionScene(ctx, time);

  // 5. ADEGAN 5 (x = 2900): Warga & Aktivis Menolak + Truk Angkut & Monitor ECG Stres
  drawProtestAndStressScene(ctx, time);

  // 6. ADEGAN 6 (x = 3700): Kaca Pembesar Peta Tambang Banten & Cutaway Bawah Tanah
  drawMiningSuspicionScene(ctx, time);

  // 7. ADEGAN 7 (x = 4450): Podium Klarifikasi Resmi, Stempel Hijau, & Tim Kajian Ilmiah
  drawOfficialClarificationScene(ctx, time);

  ctx.restore();

  // 8. Overlay Screen-Space (Hook awal + Pill Babak atas + CTA Follow akhir)
  if (time < 4.4) {
    drawRhinoHook(ctx, time, width, height);
  }

  const stage = getStagePill(time);
  if (stage) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.16,
      stage.text,
      "900 25px Arial, sans-serif",
      stage.bg,
      "#FFFFFF",
      stage.border,
      52,
    );
  }

  if (time >= 88.0) {
    const pop = progress(time, 88.2, 88.8, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function getStagePill(time) {
  if (time < 5.6) return null;
  if (time < 16.5)
    return {
      text: "🦏 UJUNG KULON — RUMAH TERAKHIR DI DUNIA",
      bg: "rgba(21, 128, 61, 0.92)",
      border: "#86EFAC",
    };
  if (time < 25.5)
    return {
      text: "🗺️ USULAN PEMERINTAH: HABITAT KEDUA",
      bg: "rgba(2, 132, 199, 0.92)",
      border: "#7DD3FC",
    };
  if (time < 37.8)
    return {
      text: "🌋 ALASAN: ANCAMAN ANAK KRAKATAU",
      bg: "rgba(180, 83, 9, 0.92)",
      border: "#FDE047",
    };
  if (time < 53.0)
    return {
      text: "⚠️ KRITIK: PENOLAKAN & RISIKO STRES",
      bg: "rgba(185, 28, 28, 0.92)",
      border: "#FCA5A5",
    };
  if (time < 66.0)
    return {
      text: "⛏️ KECURIGAAN: ISU PETA TAMBANG BANTEN",
      bg: "rgba(124, 45, 18, 0.92)",
      border: "#FDBA74",
    };
  if (time < 82.0)
    return {
      text: "🛡️ KLARIFIKASI RESMI: TANPA IZIN TAMBANG",
      bg: "rgba(15, 118, 110, 0.92)",
      border: "#99F6E4",
    };
  if (time < 88.0)
    return {
      text: "🤔 MENURUTMU, MANA YANG LEBIH TEPAT?",
      bg: "rgba(30, 41, 59, 0.92)",
      border: "#FDE047",
    };
  return null;
}

function drawWorldBackdrop(ctx, time) {
  // Langit cerah tropis luas
  const skyG = ctx.createLinearGradient(0, -150, 0, GROUND_Y);
  skyG.addColorStop(0, "#5CA9F2");
  skyG.addColorStop(0.6, "#BAE6FD");
  skyG.addColorStop(1, "#FEF9C3");
  ctx.fillStyle = skyG;
  ctx.fillRect(-350, -180, 5600, GROUND_Y + 220);

  // Langit lebih dramatis di atas Gunung Anak Krakatau (x = 1750..2500)
  const volSky = ctx.createLinearGradient(0, 150, 0, GROUND_Y);
  volSky.addColorStop(0, "rgba(30, 41, 59, 0.78)");
  volSky.addColorStop(0.65, "rgba(154, 52, 18, 0.45)");
  volSky.addColorStop(1, "rgba(251, 146, 60, 0.15)");
  ctx.fillStyle = volSky;
  ctx.fillRect(1750, -180, 760, GROUND_Y + 200);

  // Awan lembut tersebar
  for (const cx of [220, 820, 1340, 2860, 3650, 4420]) {
    drawCloud(ctx, cx + Math.sin(time * 0.25 + cx) * 24, 370 + (cx % 70), 0.9, "#FFFFFF", 0.85);
  }

  // Dasar Laut (Zona 3 Peta Jawa & Zona 4 Krakatau: x = 960 .. 2520)
  const seaG = ctx.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y + 600);
  seaG.addColorStop(0, "#0284C7");
  seaG.addColorStop(1, "#0C4A6E");
  ctx.fillStyle = seaG;
  ctx.fillRect(960, GROUND_Y - 80, 1560, 780);

  // Daratan Hutan Ujung Kulon (x = -350 .. 980)
  ctx.fillStyle = "#22C55E";
  ctx.fillRect(-350, GROUND_Y - 24, 1330, 68);
  ctx.fillStyle = "#785233";
  ctx.fillRect(-350, GROUND_Y + 40, 1330, 700);

  // Daratan Jalan & Protes (Zona 5: x = 2500 .. 3320)
  ctx.fillStyle = "#4ADE80";
  ctx.fillRect(2500, GROUND_Y - 24, 820, 45);
  ctx.fillStyle = "#475569"; // jalan aspal tempat truk angkut melintas
  ctx.fillRect(2500, GROUND_Y + 12, 820, 84);
  ctx.fillStyle = "#FDE047";
  for (let rx = 2540; rx < 3300; rx += 90) {
    ctx.fillRect(rx, GROUND_Y + 50, 46, 8);
  }
  ctx.fillStyle = "#5C4033";
  ctx.fillRect(2500, GROUND_Y + 96, 820, 640);

  // Daratan Cutaway Tambang (Zona 6: x = 3320 .. 4080)
  ctx.fillStyle = "#4D7C0F";
  ctx.fillRect(3320, GROUND_Y - 24, 760, 46);
  const earthG = ctx.createLinearGradient(0, GROUND_Y + 20, 0, GROUND_Y + 620);
  earthG.addColorStop(0, "#5C4033");
  earthG.addColorStop(0.5, "#3E2723");
  earthG.addColorStop(1, "#1C1917");
  ctx.fillStyle = earthG;
  ctx.fillRect(3320, GROUND_Y + 20, 760, 720);

  // Ruang Konferensi Pers / Podium Klarifikasi (Zona 7: x = 4080 .. 5100)
  const hallG = ctx.createLinearGradient(0, 350, 0, GROUND_Y);
  hallG.addColorStop(0, "#0F172A");
  hallG.addColorStop(1, "#1E293B");
  ctx.fillStyle = hallG;
  ctx.fillRect(4080, -180, 1020, GROUND_Y + 200);
  ctx.fillStyle = "#334155";
  ctx.fillRect(4080, GROUND_Y - 10, 1020, 740);
}

/**
 * ADEGAN 1, 2 & PENUTUP (x = 540): Hutan Ujung Kulon + Induk & Anak Badak + Polhut + Feed Viral
 */
function drawUjungKulonScene(ctx, time) {
  // Pohon tropis + burung terbang melintas
  drawTropicalTree(ctx, 180, GROUND_Y - 18, 1.05);
  drawTropicalTree(ctx, 880, GROUND_Y - 18, 0.96);
  drawTropicalTree(ctx, 320, GROUND_Y - 22, 0.78);

  // Burung kecil terbang lembut di langit Ujung Kulon
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 3.5;
  for (let b = 0; b < 3; b++) {
    const bx = 260 + ((time * 45 + b * 140) % 580);
    const by = 570 + b * 36 + Math.sin(time * 6 + b) * 8;
    ctx.beginPath();
    ctx.moveTo(bx - 12, by - 5);
    ctx.quadraticCurveTo(bx - 4, by - 12, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 12, bx + 12, by - 5);
    ctx.stroke();
  }

  // Sungai bening
  ctx.fillStyle = "#38BDF8";
  ctx.beginPath();
  ctx.ellipse(540, GROUND_Y + 12, 270, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Induk Badak Jawa + Anak Badak Jawa berjalan bersama!
  const walkX = 485 + Math.sin(time * 0.6) * 28;
  drawJavanRhino3D(ctx, walkX, GROUND_Y - 10, 1.0, time, false);
  drawJavanRhino3D(ctx, walkX + 165, GROUND_Y - 4, 0.56, time + 1.2, false);

  // Karakter Polhut (Ranger) memegang teropong & tablet penghitung di kiri (x = 240)
  drawClayCharacter3D(ctx, 240, GROUND_Y - 14, {
    shirt: "#15803D",
    hat: "#166534",
    mood: "smile",
    time,
    prop: "clipboard",
  });

  // Adegan 1 (0 - 6.0s): Gelembung Notifikasi Viral melayang di sekitar hutan!
  if (time < 6.0) {
    const pop = progress(time, 0.4, 1.0, easeOutBack) * (1 - progress(time, 5.2, 5.9));
    if (pop > 0.02) {
      ctx.save();
      ctx.globalAlpha = pop;
      drawAutoPill(ctx, 270, 740, "🔥 VIRAL DI MEDSOS", "900 22px Arial, sans-serif", "#DC2626", "#FFFFFF", "#FCA5A5", 46);
      drawAutoPill(ctx, 790, 790, "💬 PRO & KONTRA", "900 22px Arial, sans-serif", "#0284C7", "#FFFFFF", "#7DD3FC", 46);
      ctx.restore();
    }
  }

  // Adegan 2 (6.2 - 16.2s): Badge penghitung populasi langka
  if (time >= 6.2 && time <= 16.2) {
    const a = progress(time, 6.2, 6.8) * (1 - progress(time, 15.6, 16.2));
    ctx.save();
    ctx.globalAlpha = a;
    drawAutoPill(
      ctx,
      540,
      735,
      "📉 TERSISA PULUHAN EKOR • 1 LOKASI DI DUNIA",
      "900 22px Arial, sans-serif",
      "rgba(15, 23, 42, 0.88)",
      "#FEF08A",
      "#4ADE80",
      50,
    );
    ctx.restore();
  }

  // Penutup (82.0 - 92.0s): Perisai Konservasi + 2 Pilihan Diskusi (Netral)
  if (time >= 82.0) {
    const a = progress(time, 82.2, 83.0, easeOutCubic);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#34D399";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(540, GROUND_Y - 85, 310, Math.PI, Math.PI * 2);
    ctx.stroke();

    drawAutoPill(ctx, 325, 755, "🛡️ PERKUAT UJUNG KULON?", "900 21px Arial, sans-serif", "rgba(21, 128, 61, 0.94)", "#FFFFFF", "#86EFAC", 48);
    drawAutoPill(ctx, 755, 755, "🌿 ATAU HABITAT KEDUA?", "900 21px Arial, sans-serif", "rgba(2, 132, 199, 0.94)", "#FFFFFF", "#7DD3FC", 48);
    ctx.restore();
  }
}

/**
 * ADEGAN 3 (x = 1340): Peta Pulau Jawa 3D + Rute Usulan Ujung Kulon -> Alas Purwo
 */
function drawJavaMapScene(ctx, time) {
  const cx = 1340;
  const cy = 920;

  // Siluet Pulau Jawa 3D bergaya bersih di atas laut biru
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.beginPath();
  ctx.moveTo(cx - 340, cy + 18);
  ctx.lineTo(cx - 120, cy - 16);
  ctx.lineTo(cx + 180, cy + 8);
  ctx.lineTo(cx + 350, cy + 52);
  ctx.lineTo(cx + 320, cy + 108);
  ctx.lineTo(cx + 120, cy + 88);
  ctx.lineTo(cx - 160, cy + 92);
  ctx.lineTo(cx - 330, cy + 72);
  ctx.closePath();
  ctx.fill();

  const islandG = ctx.createLinearGradient(cx - 340, cy - 30, cx + 350, cy + 100);
  islandG.addColorStop(0, "#22C55E");
  islandG.addColorStop(1, "#15803D");
  ctx.fillStyle = islandG;
  ctx.beginPath();
  ctx.moveTo(cx - 345, cy + 4);
  ctx.lineTo(cx - 125, cy - 30);
  ctx.lineTo(cx + 175, cy - 6);
  ctx.lineTo(cx + 345, cy + 38);
  ctx.lineTo(cx + 315, cy + 94);
  ctx.lineTo(cx + 115, cy + 74);
  ctx.lineTo(cx - 165, cy + 78);
  ctx.lineTo(cx - 335, cy + 58);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#DCFCE7";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Pin Kiri: UJUNG KULON (Banten)
  const ux = cx - 310;
  const uy = cy + 28;
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.arc(ux, uy, 16, 0, Math.PI * 2);
  ctx.fill();
  drawAutoPill(ctx, ux + 20, uy + 82, "📍 UJUNG KULON", "900 19px Arial, sans-serif", "#1E293B", "#FEF08A", "#EF4444", 40);

  // Pin Kanan: ALAS PURWO (Jawa Timur)
  const ax = cx + 310;
  const ay = cy + 62;
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.arc(ax, ay, 16, 0, Math.PI * 2);
  ctx.fill();
  drawAutoPill(ctx, ax - 20, ay + 82, "📍 ALAS PURWO (JATIM)", "900 19px Arial, sans-serif", "#15803D", "#FFFFFF", "#86EFAC", 40);

  // Garis Rute Melengkung + Ikon Badak Translokasi terbang melintas (16.8s - 24.5s)!
  const fly = progress(time, 16.8, 24.5, easeInOutCubic);
  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 7;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(ux, uy);
  ctx.quadraticCurveTo(cx, cy - 230, ax, ay);
  ctx.stroke();
  ctx.setLineDash([]);

  // Posisi ikon di kurva Bezier kuadratik
  const t = fly;
  const px = (1 - t) * (1 - t) * ux + 2 * (1 - t) * t * cx + t * t * ax;
  const py = (1 - t) * (1 - t) * uy + 2 * (1 - t) * t * (cy - 230) + t * t * ay;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(px, py, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "900 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🦏", px, py + 1);

  drawAutoPill(ctx, cx, cy - 265, "RENCANA TRANSLOKASI ~1.000 KM", "900 21px Arial, sans-serif", "rgba(15, 23, 42, 0.9)", "#FDE047", "#38BDF8", 44);
  ctx.restore();
}

/**
 * ADEGAN 4 (x = 2120): Erupsi Gunung Anak Krakatau + Gelombang Tsunami
 */
function drawKrakatauEruptionScene(ctx, time) {
  const vx = 2120;
  const vy = GROUND_Y - 75;

  // Gunung Anak Krakatau
  const volG = ctx.createLinearGradient(vx, vy - 280, vx, vy);
  volG.addColorStop(0, "#475569");
  volG.addColorStop(1, "#0F172A");
  ctx.fillStyle = volG;
  ctx.beginPath();
  ctx.moveTo(vx - 230, vy);
  ctx.lineTo(vx - 52, vy - 270);
  ctx.lineTo(vx + 52, vy - 270);
  ctx.lineTo(vx + 230, vy);
  ctx.closePath();
  ctx.fill();

  // Semburan lava pijar + percikan api ke atas!
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.ellipse(vx, vy - 270, 50, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const cyc = (time * 0.75 + i * 0.17) % 1;
    const angle = -Math.PI / 2 + (i - 2.5) * 0.25;
    const sx = vx + Math.cos(angle) * cyc * 140;
    const sy = vy - 275 + Math.sin(angle) * cyc * 170 + cyc * cyc * 85;
    ctx.fillStyle = i % 2 === 0 ? "#FDE047" : "#EF4444";
    ctx.beginPath();
    ctx.arc(sx, sy, 8 * (1 - cyc * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Kepulan asap abu vulkanik
  for (let i = 0; i < 4; i++) {
    const cyc = (time * 0.4 + i * 0.25) % 1;
    ctx.fillStyle = `rgba(100, 116, 139, ${(1 - cyc) * 0.78})`;
    ctx.beginPath();
    ctx.arc(vx + Math.sin(cyc * 5 + i) * 38, lerp(vy - 280, vy - 480, cyc), 32 + cyc * 48, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gelombang Tsunami bergulung di kaki gunung!
  const waveShift = (time * 120) % 240;
  ctx.fillStyle = "#38BDF8";
  ctx.beginPath();
  ctx.moveTo(vx - 320, vy + 75);
  ctx.quadraticCurveTo(vx - 190 - waveShift * 0.4, vy - 55, vx - 120 - waveShift * 0.4, vy + 75);
  ctx.closePath();
  ctx.fill();

  drawAutoPill(ctx, vx, vy + 108, "⚠️ RISIKO LETUSAN & TSUNAMI SELAT SUNDA", "900 21px Arial, sans-serif", "rgba(153, 27, 27, 0.94)", "#FEF08A", "#FCA5A5", 48);
}

/**
 * ADEGAN 5 (x = 2900): Warga/Aktivis Menolak (Kiri) + Truk Angkut & Monitor Stres ECG (Kanan)
 */
function drawProtestAndStressScene(ctx, time) {
  const cx = 2900;

  // --- KIRI: 2 Karakter Aktivis & Warga Lokal memegang papan protes bergoyang ---
  drawClayCharacter3D(ctx, cx - 255, GROUND_Y + 6, {
    shirt: "#0F766E",
    hat: "#F59E0B",
    mood: "serious",
    time,
    prop: "sign",
    signText: "JAGA TNUK!",
  });
  drawClayCharacter3D(ctx, cx - 125, GROUND_Y + 10, {
    shirt: "#B91C1C",
    hat: null,
    mood: "serious",
    time: time + 0.8,
    prop: "sign",
    signText: "TOLAK!",
  });

  // --- KANAN: Truk Angkut Badak Jawa bergetar + Monitor Detak Jantung Stres (ECG) ---
  const bump = Math.sin(time * 14) * 4;
  const tx = cx + 145;
  const ty = GROUND_Y + 26 + bump;

  // Bak Truk + Badak di dalam kandang
  ctx.fillStyle = "#92400E";
  drawRoundedRect(ctx, tx - 150, ty - 175, 240, 145, 12);
  ctx.fill();
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, tx - 138, ty - 163, 216, 121, 8);
  ctx.fill();
  drawJavanRhino3D(ctx, tx - 35, ty - 48, 0.56, time, true);

  // Jeruji bak truk
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 6;
  for (let bx = tx - 110; bx <= tx + 50; bx += 40) {
    ctx.beginPath();
    ctx.moveTo(bx, ty - 163);
    ctx.lineTo(bx, ty - 42);
    ctx.stroke();
  }

  // Kabin Truk
  ctx.fillStyle = "#EAB308";
  drawRoundedRect(ctx, tx + 90, ty - 120, 88, 90, 12);
  ctx.fill();
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, tx + 115, ty - 108, 52, 42, 6);
  ctx.fill();

  // Roda Truk berputar
  for (const wx of [tx - 95, tx + 35, tx + 135]) {
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(wx, ty - 24, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94A3B8";
    ctx.beginPath();
    ctx.arc(wx, ty - 24, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layar Monitor ECG Detak Jantung Stres di atas truk!
  const mx = tx - 20;
  const my = ty - 265;
  ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
  drawRoundedRect(ctx, mx - 155, my - 52, 310, 104, 14);
  ctx.fill();
  ctx.strokeStyle = "#EF4444";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Garis ECG berdenyut cepat
  ctx.strokeStyle = "#EF4444";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 260; i += 10) {
    const px = mx - 130 + i;
    const phase = (i + time * 180) % 90;
    let dy = 0;
    if (phase > 30 && phase < 42) dy = -26;
    else if (phase >= 42 && phase < 52) dy = 18;
    if (i === 0) ctx.moveTo(px, my + 12 + dy);
    else ctx.lineTo(px, my + 12 + dy);
  }
  ctx.stroke();

  ctx.fillStyle = "#FCA5A5";
  ctx.font = "900 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("❤️‍🔥 STRES & RISIKO KEMATIAN TINGGI", mx, my - 26);
}

/**
 * ADEGAN 6 (x = 3700): Dokumen Peta Tambang Banten + Kaca Pembesar + Cutaway Mineral Bawah Tanah
 */
function drawMiningSuspicionScene(ctx, time) {
  const cx = 3700;

  // --- ATAS: Dokumen Peta Wilayah Pertambangan Banten 2026 ---
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, cx - 190, GROUND_Y - 310, 380, 250, 16);
  ctx.fill();
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PETA WILAYAH TAMBANG", cx, GROUND_Y - 265);
  ctx.fillStyle = "#B45309";
  ctx.font = "800 18px Arial, sans-serif";
  ctx.fillText("PROVINSI BANTEN • 2026", cx, GROUND_Y - 236);

  // Garis peta & zona oranye di dalam dokumen
  ctx.fillStyle = "#FEF3C7";
  drawRoundedRect(ctx, cx - 150, GROUND_Y - 215, 300, 130, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(245, 158, 11, 0.55)";
  ctx.beginPath();
  ctx.arc(cx - 40, GROUND_Y - 145, 42, 0, Math.PI * 2);
  ctx.arc(cx + 55, GROUND_Y - 155, 34, 0, Math.PI * 2);
  ctx.fill();

  // Kaca Pembesar bergerak memindai peta!
  const lensX = cx + Math.sin(time * 2.4) * 95;
  const lensY = GROUND_Y - 155 + Math.cos(time * 2.4) * 26;
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(lensX + 34, lensY + 34);
  ctx.lineTo(lensX + 76, lensY + 76);
  ctx.stroke();
  ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
  ctx.beginPath();
  ctx.arc(lensX, lensY, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 8;
  ctx.stroke();

  // --- BAWAH (CUTAWAY TANAH): Urat Mineral Emas & Tanda Tanya Kecurigaan Publik ---
  const mineY = GROUND_Y + 195;
  const veins = [
    [cx - 180, mineY - 15, 34],
    [cx - 85, mineY + 35, 42],
    [cx + 15, mineY - 10, 38],
    [cx + 125, mineY + 25, 44],
    [cx + 210, mineY - 18, 30],
  ];
  for (const [rx, ry, rr] of veins) {
    const rg = ctx.createRadialGradient(rx - 8, ry - 8, 4, rx, ry, rr);
    rg.addColorStop(0, "#FEF08A");
    rg.addColorStop(0.55, "#F59E0B");
    rg.addColorStop(1, "#92400E");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  const qPulse = 1 + Math.sin(time * 5) * 0.05;
  ctx.save();
  ctx.translate(cx, mineY - 82);
  ctx.scale(qPulse, qPulse);
  drawAutoPill(ctx, 0, 0, "❓ KECURIGAAN WALHI & PUBLIK", "900 22px Arial, sans-serif", "rgba(15, 23, 42, 0.94)", "#FDE047", "#F59E0B", 48);
  ctx.restore();
}

/**
 * ADEGAN 7 (x = 4450): Podium Klarifikasi Resmi + Stempel Hijau + Tim Kajian Ilmiah
 */
function drawOfficialClarificationScene(ctx, time) {
  const cx = 4450;

  // Karakter Juru Bicara Pemerintah di Podium (Kiri)
  drawClayCharacter3D(ctx, cx - 150, GROUND_Y - 12, {
    shirt: "#1E40AF",
    hat: null,
    mood: "serious",
    time,
    prop: "none",
  });
  // Podium depan juru bicara
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, cx - 220, GROUND_Y - 135, 140, 128, 10);
  ctx.fill();
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "900 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ESDM & KEHUTANAN", cx - 150, GROUND_Y - 72);

  // Karakter Ilmuwan/Peneliti di Kanan (Kajian Ilmiah Matang)
  drawClayCharacter3D(ctx, cx + 190, GROUND_Y - 12, {
    shirt: "#F8FAFC",
    hat: null,
    mood: "smile",
    time: time + 0.6,
    prop: "clipboard",
  });

  // Papan Klarifikasi Besar di Tengah-Atas + Stempel Animasi "TANPA IZIN TAMBANG"!
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, cx - 190, 680, 380, 210, 18);
  ctx.fill();
  ctx.strokeStyle = "#0F766E";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KLARIFIKASI PEMERINTAH:", cx, 725);
  ctx.fillStyle = "#334155";
  ctx.font = "700 19px Arial, sans-serif";
  ctx.fillText("1. TNUK Bukan Wilayah Tambang", cx, 766);
  ctx.fillText("2. Menunggu Kajian Ilmiah Matang", cx, 800);

  // Stempel hijau "BANTAHAN RESMI" turun membanting (68.0s+)
  const stamp = progress(time, 67.8, 68.5, easeOutBack);
  if (stamp > 0.02) {
    ctx.save();
    ctx.translate(cx, 852);
    ctx.rotate(-0.08);
    ctx.scale(lerp(1.8, 1.0, stamp), lerp(1.8, 1.0, stamp));
    drawAutoPill(ctx, 0, 0, "🛡️ 0 IZIN TAMBANG DI TNUK", "900 21px Arial, sans-serif", "#0F766E", "#FFFFFF", "#99F6E4", 46);
    ctx.restore();
  }
}

/**
 * Karakter 3D Minimalis Clay-Toy reusable (Polhut, Aktivis, Juru Bicara, Ilmuwan).
 */
function drawClayCharacter3D(ctx, x, baseY, opts) {
  const { shirt, hat, mood, time, prop, signText } = opts;
  const bob = Math.sin(time * 3.5) * 3;

  ctx.save();
  ctx.translate(x, baseY);

  // Bayangan lembut
  ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sepatu & Celana
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, -26, -15, 22, 15, 6);
  ctx.fill();
  drawRoundedRect(ctx, 4, -15, 22, 15, 6);
  ctx.fill();
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -23, -78, 19, 66, 8);
  ctx.fill();
  drawRoundedRect(ctx, 4, -78, 19, 66, 8);
  ctx.fill();

  // Badan
  ctx.fillStyle = shirt;
  drawRoundedRect(ctx, -35, -162 + bob, 70, 90, 22);
  ctx.fill();

  // Kepala bulat 3D
  const headY = -198 + bob;
  const headG = ctx.createRadialGradient(-10, headY - 10, 6, 0, headY, 38);
  headG.addColorStop(0, "#FDE0C2");
  headG.addColorStop(1, "#D4A373");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, headY, 34, 0, Math.PI * 2);
  ctx.fill();

  // Mata & Mulut
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(-11, headY + 2, 3.6, 0, Math.PI * 2);
  ctx.arc(11, headY + 2, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  if (mood === "serious") {
    ctx.moveTo(-8, headY + 15);
    ctx.lineTo(8, headY + 15);
  } else {
    ctx.arc(0, headY + 10, 8, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();

  if (hat) {
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.arc(0, headY - 12, 36, Math.PI, Math.PI * 2);
    ctx.fill();
    drawRoundedRect(ctx, -44, headY - 16, 88, 9, 4);
    ctx.fill();
  }

  // Properti: Papan Protes bergoyang atau Clipboard
  if (prop === "sign") {
    const wave = Math.sin(time * 5) * 0.12;
    ctx.save();
    ctx.translate(32, -135 + bob);
    ctx.rotate(wave);
    ctx.fillStyle = "#92400E";
    ctx.fillRect(-4, -95, 8, 120);
    ctx.fillStyle = "#FFFFFF";
    drawRoundedRect(ctx, -64, -140, 128, 54, 8);
    ctx.fill();
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#DC2626";
    ctx.font = "900 17px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(signText || "JAGA!", 0, -108);
    ctx.restore();
  } else if (prop === "clipboard") {
    ctx.fillStyle = "#B45309";
    drawRoundedRect(ctx, 22, -130 + bob, 32, 42, 5);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(26, -124 + bob, 24, 30);
  }

  ctx.restore();
}

/**
 * Badak Jawa Bercula Satu bergaya 3D Stylized Clay-Toy.
 */
function drawJavanRhino3D(ctx, cx, baseY, scale, time, isStressed) {
  const breathe = Math.sin(time * (isStressed ? 9 : 2.5)) * 3;
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 134, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, -94, -70, 32, 72, 12);
  ctx.fill();
  drawRoundedRect(ctx, -40, -66, 32, 68, 12);
  ctx.fill();
  drawRoundedRect(ctx, 26, -70, 32, 72, 12);
  ctx.fill();
  drawRoundedRect(ctx, 72, -66, 32, 68, 12);
  ctx.fill();

  const bodyG = ctx.createRadialGradient(-25, -145 + breathe, 20, 0, -118 + breathe, 145);
  bodyG.addColorStop(0, "#94A3B8");
  bodyG.addColorStop(0.6, "#64748B");
  bodyG.addColorStop(1, "#334155");
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.ellipse(0, -116 + breathe, 120, 72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(38, -116 + breathe, 64, -1.1, 1.0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-48, -116 + breathe, 62, 2.1, 4.1);
  ctx.stroke();

  const headX = 120;
  const headY = -124 + breathe;
  const headG = ctx.createRadialGradient(headX - 10, headY - 18, 10, headX, headY, 64);
  headG.addColorStop(0, "#94A3B8");
  headG.addColorStop(0.7, "#64748B");
  headG.addColorStop(1, "#334155");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 54, 40, 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.ellipse(headX - 24, headY - 38, 10, 18, -0.3, 0, Math.PI * 2);
  ctx.fill();

  const hornG = ctx.createLinearGradient(headX + 35, headY - 66, headX + 46, headY - 12);
  hornG.addColorStop(0, "#FEF3C7");
  hornG.addColorStop(1, "#92400E");
  ctx.fillStyle = hornG;
  ctx.beginPath();
  ctx.moveTo(headX + 24, headY - 18);
  ctx.quadraticCurveTo(headX + 42, headY - 64, headX + 54, headY - 60);
  ctx.quadraticCurveTo(headX + 52, headY - 26, headX + 46, headY - 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(headX + 10, headY - 8, isStressed ? 6 : 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(headX + 8, headY - 10, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTropicalTree(ctx, x, baseY, scale) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#78350F";
  drawRoundedRect(ctx, -18, -220, 36, 220, 10);
  ctx.fill();

  for (const [cx, cy, cr] of [
    [-60, -230, 68],
    [60, -230, 68],
    [0, -285, 84],
  ]) {
    const cg = ctx.createRadialGradient(cx - 18, cy - 18, 10, cx, cy, cr);
    cg.addColorStop(0, "#4ADE80");
    cg.addColorStop(1, "#15803D");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRhinoHook(ctx, time, width, height) {
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
    "🦏 ISU VIRAL KONSERVASI",
    "900 32px Arial, sans-serif",
    "#15803D",
    "#FEF08A",
    "#86EFAC",
    68,
  );

  ctx.lineJoin = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
  ctx.font = "900 44px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("KENAPA BADAK JAWA", 0, 10);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("KENAPA BADAK JAWA", 0, 10);

  ctx.strokeText("MAU DIPINDAH DARI UJUNG KULON?", 0, 70);
  ctx.fillStyle = "#FFD43B";
  ctx.fillText("MAU DIPINDAH DARI UJUNG KULON?", 0, 70);
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
