import {
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  lerpColor,
  progress,
} from "../engine/math.js";
import { drawRoundedRect } from "../engine/shapes.js";

/**
 * Scene Explainer: "Makan Malam Bikin Gemuk? Jam Berapa Sebenarnya yang Berbahaya?"
 * Durasi total: 32 detik (9:16, 1080x1920)
 *
 * Struktur APA -> KENAPA -> BAGAIMANA:
 *  0.0 -  3.8s : CLICKBAIT HOOK — Jam dinding melewati 19:00 + banner "MITOS ATAU FAKTA?!"
 *  3.8 - 10.5s : APA — Perbandingan 2 piring identik (550 kkal di 18:00 vs 21:30) + timbangan kalori seimbang
 * 10.5 - 16.0s : KENAPA #1 — Ritme Sirkadian (studi Harvard): Ghrelin naik, pembakaran turun, rawan surplus kalori
 * 16.0 - 22.0s : KENAPA #2 — Rebahan setelah makan -> asam lambung naik (GERD) & tidur terganggu
 * 22.0 - 28.5s : BAGAIMANA — Bukan patokan jam 7, tapi aturan JEDA 2-3 JAM sebelum tidur + total kalori harian
 * 28.5 - 32.0s : CTA — "+ FOLLOW" untuk fakta menarik lainnya
 */

export function drawLateDinnerScene(ctx, time, width, height) {
  // 1. Latar gradien modern hangat-malam (berubah halus sesuai babak)
  drawStageBackground(ctx, time, width, height);

  // 2. Babak 1 & 2: Meja makan + Jam dinding + Perbandingan 2 piring (0.0s - 15.1s)
  if (time < 15.2) {
    const fadeOut = 1 - progress(time, 14.5, 15.2, easeInOutCubic);
    ctx.save();
    ctx.globalAlpha = fadeOut;
    drawPlatesComparisonAct(ctx, time, width, height);
    ctx.restore();
  }

  // 3. Visual Hook Clickbait di awal (0.0s - 5.8s)
  if (time < 5.9) {
    drawMythHookBanner(ctx, time, width, height);
  }

  // 4. Babak 3 (KENAPA #1): Ritme Sirkadian & Hormon Harvard Study (14.8s - 24.2s)
  if (time >= 14.8 && time < 24.3) {
    const alpha =
      progress(time, 14.8, 15.5, easeOutCubic) *
      (1 - progress(time, 23.6, 24.3, easeInOutCubic));
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCircadianAct(ctx, time, width, height);
    ctx.restore();
  }

  // 5. Babak 4 (KENAPA #2): Cross-section GERD / Asam Lambung Naik (23.8s - 31.2s)
  if (time >= 23.8 && time < 31.3) {
    const alpha =
      progress(time, 23.8, 24.5, easeOutCubic) *
      (1 - progress(time, 30.6, 31.3, easeInOutCubic));
    ctx.save();
    ctx.globalAlpha = alpha;
    drawRefluxAct(ctx, time, width, height);
    ctx.restore();
  }

  // 6. Babak 5 (BAGAIMANA): Timeline Jam Tidur & Aturan 2-3 Jam (30.8s - 43.0s)
  if (time >= 30.8) {
    const alpha = progress(time, 30.8, 31.5, easeOutCubic);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawSafeRuleAct(ctx, time, width, height);
    ctx.restore();
  }

  // 7. Babak 6 (CTA): Badge "+ FOLLOW" (39.2s - 43.0s)
  if (time >= 39.2) {
    const pop = progress(time, 39.3, 39.9, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawStageBackground(ctx, time, width, height) {
  const refluxFactor = progress(time, 23.8, 24.6) - progress(time, 30.6, 31.4);
  const safeFactor = progress(time, 30.8, 31.8);

  let top = lerpColor("#132238", "#2E1624", clamp(refluxFactor, 0, 1));
  let bot = lerpColor("#1E3A5F", "#4A1D2C", clamp(refluxFactor, 0, 1));
  top = lerpColor(top, "#102A30", safeFactor);
  bot = lerpColor(bot, "#1B4952", safeFactor);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Lingkaran dekorasi halus di background
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.18, 260, 0, Math.PI * 2);
  ctx.arc(width * 0.14, height * 0.62, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * HOOK CLICKBAIT (0.0s - 3.8s): "⚠ MITOS ATAU FAKTA?!"
 */
function drawMythHookBanner(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.38, easeOutBack);
  const exit = 1 - progress(time, 5.2, 5.8, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;

  const shakeX = time < 0.45 ? Math.sin(time * 65) * 8 * (1 - time / 0.45) : 0;
  ctx.translate(width / 2 + shakeX, height * 0.23);
  ctx.scale(clamp(enter, 0.01, 1.06), clamp(enter, 0.01, 1.06));

  // Pill Merah-Kuning (lebar otomatis mengikuti teks agar tidak pernah terpotong)
  const hookBadgeText = "⚠ MITOS ATAU FAKTA?!";
  ctx.font = "900 44px Arial, sans-serif";
  const hookBadgeW = Math.max(540, ctx.measureText(hookBadgeText).width + 68);

  ctx.shadowColor = "rgba(239, 68, 68, 0.55)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#DC2626";
  drawRoundedRect(ctx, -hookBadgeW / 2, -130, hookBadgeW, 82, 20);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, -hookBadgeW / 2, -130, hookBadgeW, 82, 20);
  ctx.stroke();

  ctx.fillStyle = "#FDE047";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(hookBadgeText, 0, -88);

  // Headline 2 baris
  ctx.lineJoin = "round";
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
  ctx.font = "900 58px Arial, sans-serif";

  ctx.strokeText("MAKAN DI ATAS JAM 7", 0, 6);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("MAKAN DI ATAS JAM 7", 0, 6);

  ctx.strokeText("OTOMATIS GEMUK?", 0, 76);
  ctx.fillStyle = "#FFD43B";
  ctx.fillText("OTOMATIS GEMUK?", 0, 76);

  // Subteks penasaran
  const subA = progress(time, 0.45, 0.85);
  ctx.globalAlpha = exit * subA;
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  drawRoundedRect(ctx, -320, 120, 640, 54, 27);
  ctx.fill();
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("Jam berapa sebenarnya yang berbahaya?", 0, 148);

  ctx.restore();
}

/**
 * BABAK 1 & 2 (APA): Jam dinding 19:00 + Perbandingan 2 Piring Kalori Sama (550 kkal)
 */
function drawPlatesComparisonAct(ctx, time, width, height) {
  // Meja makan kayu di bagian bawah
  const tableY = 1130;
  ctx.fillStyle = "#7C4D2B";
  ctx.fillRect(0, tableY, width, 160);
  ctx.fillStyle = "#5E391F";
  ctx.fillRect(0, tableY + 150, width, 640);

  // Di 0-5.8s: Jam dinding besar berdetak melewati 19:00 di tengah
  const clockExit = 1 - progress(time, 5.4, 6.0, easeInOutCubic);
  if (clockExit > 0.01) {
    ctx.save();
    ctx.globalAlpha = clockExit;
    const minuteSweep = lerp(52, 65, progress(time, 0.5, 4.4, easeInOutCubic));
    drawWallClock(
      ctx,
      width / 2,
      860,
      145,
      6 + minuteSweep / 60,
      minuteSweep % 60,
      time > 2.4,
    );
    ctx.restore();
  }

  // Di 5.9s - 15.2s: Perbandingan 2 Piring Identik (18:00 vs 21:30)
  const compareEnter = progress(time, 5.9, 6.7, easeOutBack);
  if (compareEnter > 0.01) {
    // Judul Babak APA
    ctx.save();
    ctx.globalAlpha = Math.min(1, compareEnter);
    ctx.fillStyle = "#38BDF8";
    ctx.font = "900 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PERBANDINGAN KALORI SAMA", width / 2, 265);
    ctx.restore();

    const leftX = 290;
    const rightX = 790;
    const cardY = 480;

    // Kartu Kiri: Jam 18:00 (Sore)
    drawMealCard(
      ctx,
      leftX,
      cardY,
      "18:00",
      "MAKAN SORE",
      "#F59E0B",
      compareEnter,
      time,
    );

    // Kartu Kanan: Jam 21:30 (Malam)
    drawMealCard(
      ctx,
      rightX,
      cardY,
      "21:30",
      "MAKAN MALAM",
      "#6366F1",
      compareEnter,
      time,
    );

    // Tanda "=" besar di tengah (muncul saat "itu sama saja" di ~10.6s)
    const eqPop = progress(time, 10.4, 11.0, easeOutBack);
    if (eqPop > 0.01) {
      ctx.save();
      ctx.translate(width / 2, cardY + 260);
      ctx.scale(clamp(eqPop, 0.01, 1.05), clamp(eqPop, 0.01, 1.05));
      ctx.fillStyle = "#22C55E";
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 72px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("=", 0, 4);
      ctx.restore();
    }

    // 2 Piring makanan identik di atas meja
    drawFoodPlate(ctx, leftX, tableY + 55, clamp(compareEnter, 0.01, 1.05));
    drawFoodPlate(ctx, rightX, tableY + 55, clamp(compareEnter, 0.01, 1.05));

    // Stempel "Kuncinya: TOTAL KALORI HARIAN" (12.0s - 15.0s)
    const stampPop = progress(time, 11.9, 12.5, easeOutBack);
    if (stampPop > 0.01) {
      ctx.save();
      ctx.translate(width / 2, 1020);
      ctx.scale(clamp(stampPop, 0.01, 1.05), clamp(stampPop, 0.01, 1.05));
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      drawRoundedRect(ctx, -390, -52, 780, 104, 22);
      ctx.fill();
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, -390, -52, 780, 104, 22);
      ctx.stroke();

      ctx.fillStyle = "#4ADE80";
      ctx.font = "900 34px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("550 kkal tetap 550 kkal!", 0, -10);
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillText("Kuncinya: TOTAL KALORI HARIAN", 0, 28);
      ctx.restore();
    }
  }
}

function drawWallClock(ctx, x, y, r, hourVal, minVal, isPastSeven) {
  ctx.save();
  ctx.translate(x, y);

  // Bingkai jam
  ctx.fillStyle = isPastSeven ? "#EF4444" : "#334155";
  ctx.beginPath();
  ctx.arc(0, 0, r + 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#F8FAFC";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Garis angka jam
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = i === 7 ? "#DC2626" : "#64748B";
    ctx.lineWidth = i === 7 ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 22), Math.sin(a) * (r - 22));
    ctx.lineTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.stroke();
  }

  // Jarum jam
  const hAngle = ((hourVal % 12) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(hAngle) * (r * 0.52), Math.sin(hAngle) * (r * 0.52));
  ctx.stroke();

  // Jarum menit
  const mAngle = (minVal / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(mAngle) * (r * 0.76), Math.sin(mAngle) * (r * 0.76));
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  // Label digital di bawah jam
  ctx.fillStyle = isPastSeven ? "#DC2626" : "#1E293B";
  drawRoundedRect(ctx, -95, r + 26, 190, 56, 14);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPastSeven ? "19:05" : "18:55", 0, r + 55);

  ctx.restore();
}

function drawMealCard(ctx, cx, y, clockText, label, accentColor, enter, time) {
  ctx.save();
  ctx.translate(cx, y);
  ctx.scale(clamp(enter, 0.01, 1.03), clamp(enter, 0.01, 1.03));

  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  drawRoundedRect(ctx, -185, -135, 370, 385, 26);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, -185, -135, 370, 385, 26);
  ctx.stroke();

  // Jam besar
  ctx.fillStyle = accentColor;
  drawRoundedRect(ctx, -125, -108, 250, 68, 16);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 42px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(clockText, 0, -72);

  // Sub-label
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText(label, 0, -10);

  // Counter kalori animasi naik 0 -> 550 kkal
  const kcal = Math.round(lerp(0, 550, progress(time, 6.4, 7.8, easeOutCubic)));
  ctx.fillStyle = "#FDE047";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText(`${kcal}`, 0, 82);
  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("kkal (porsi sama)", 0, 134);

  // Bar energi identik
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -135, 175, 270, 26, 13);
  ctx.fill();
  ctx.fillStyle = "#22C55E";
  drawRoundedRect(ctx, -135, 175, 270 * (kcal / 550), 26, 13);
  ctx.fill();

  ctx.restore();
}

function drawFoodPlate(ctx, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Bayangan piring
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 145, 32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Piring putih
  ctx.fillStyle = "#F1F5F9";
  ctx.beginPath();
  ctx.ellipse(0, 8, 142, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.ellipse(0, 8, 108, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nasi putih (kiri)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-44, -2, 38, Math.PI, 0);
  ctx.fill();

  // Ayam panggang (kanan)
  ctx.fillStyle = "#D97706";
  ctx.beginPath();
  ctx.ellipse(34, -4, 44, 22, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#92400E";
  ctx.fillRect(14, -14, 12, 4);
  ctx.fillRect(36, -12, 12, 4);

  // Sayur brokoli (tengah-depan)
  ctx.fillStyle = "#22C55E";
  ctx.beginPath();
  ctx.arc(-6, 4, 18, 0, Math.PI * 2);
  ctx.arc(14, 8, 15, 0, Math.PI * 2);
  ctx.arc(-22, 10, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * BABAK 3 (KENAPA #1): Studi Harvard & Ritme Sirkadian (10.3s - 16.3s)
 */
function drawCircadianAct(ctx, time, width, height) {
  const enter = progress(time, 15.2, 16.0, easeOutCubic);

  // Header
  ctx.fillStyle = "#FDE047";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KENAPA MAKAN LARUT BISA BIKIN GEMUK?", width / 2, 265);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText(
    "Riset Harvard Medical School (Ritme Sirkadian)",
    width / 2,
    312,
  );

  // Kartu Infografik Jam Biologis
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  drawRoundedRect(ctx, 80, 365, width - 160, 760, 32);
  ctx.fill();
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 80, 365, width - 160, 760, 32);
  ctx.stroke();

  // Ikon Bulan + Melatonin
  ctx.save();
  ctx.translate(width / 2, 470);
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(20, -10, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("Malam Hari = Mode Istirahat Tubuh", 0, 82);
  ctx.restore();

  // 3 Meteran Biologis (Ghrelin naik, Bakar kalori turun, Ngemil surplus naik)
  const bar1 = progress(time, 19.2, 20.8, easeOutCubic);
  const bar2 = progress(time, 17.5, 19.2, easeOutCubic);
  const bar3 = progress(time, 21.2, 22.8, easeOutCubic);

  drawMeterRow(
    ctx,
    140,
    620,
    width - 280,
    "Hormon Lapar (Ghrelin)",
    "NAIK ↑",
    bar1 * 0.88,
    "#EF4444",
  );
  drawMeterRow(
    ctx,
    140,
    760,
    width - 280,
    "Pembakaran Kalori Istirahat",
    "TURUN ↓",
    lerp(0.8, 0.38, bar2),
    "#F59E0B",
  );
  drawMeterRow(
    ctx,
    140,
    900,
    width - 280,
    "Risiko Ngemil & Surplus Kalori",
    "TINGGI ↑",
    bar3 * 0.92,
    "#EC4899",
  );

  // Kesimpulan kecil di bawah kartu
  ctx.fillStyle = "#FCA5A5";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.globalAlpha = enter;
  ctx.fillText(
    "Bukan jam 7-nya, tapi surplus kalori & hormon lapar!",
    width / 2,
    1065,
  );
}

function drawMeterRow(ctx, x, y, w, title, badge, fillRatio, color) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "#F1F5F9";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText(title, x, y);

  ctx.textAlign = "right";
  ctx.fillStyle = color;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText(badge, x + w, y);

  // Track bar
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, x, y + 22, w, 34, 17);
  ctx.fill();

  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y + 22, Math.max(24, w * fillRatio), 34, 17);
  ctx.fill();
  ctx.restore();
}

/**
 * BABAK 4 (KENAPA #2): Cross-section Rebahan -> Asam Lambung Naik (GERD) (15.8s - 22.3s)
 */
function drawRefluxAct(ctx, time, width, height) {
  ctx.fillStyle = "#FCA5A5";
  ctx.font = "900 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BAHAYA REBAHAN SETELAH MAKAN", width / 2, 265);

  ctx.fillStyle = "#E2E8F0";
  ctx.font = "bold 25px Arial, sans-serif";
  ctx.fillText("Gravitasi tidak lagi menahan asam lambung", width / 2, 312);

  // Kasur & Orang Rebahan (Cross-section sederhana & jelas)
  const bedY = 890;
  ctx.fillStyle = "#CBD5E1";
  drawRoundedRect(ctx, 100, bedY, width - 200, 115, 24);
  ctx.fill();
  // Bantal
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, 115, bedY - 48, 175, 58, 22);
  ctx.fill();

  // Siluet Kepala & Tubuh Rebahan
  ctx.fillStyle = "#94A3B8";
  // Kepala di atas bantal
  ctx.beginPath();
  ctx.arc(215, bedY - 82, 54, 0, Math.PI * 2);
  ctx.fill();
  // Badan horizontal
  drawRoundedRect(ctx, 265, bedY - 115, 480, 115, 48);
  ctx.fill();

  // Diagram Kerongkongan & Lambung di dalam tubuh
  const refluxProg = progress(time, 25.4, 29.4, easeInOutCubic);

  // Kerongkongan (pipa dari leher ke lambung)
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 34;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(265, bedY - 62);
  ctx.lineTo(485, bedY - 62);
  ctx.stroke();

  // Kantung Lambung (kanan)
  ctx.fillStyle = "#7F1D1D";
  ctx.beginPath();
  ctx.ellipse(535, bedY - 58, 72, 46, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Asam lambung hijau-kuning mengalir mundur ke kerongkongan!
  const acidEndX = lerp(490, 275, refluxProg);
  ctx.strokeStyle = "#A3E635";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(525, bedY - 60);
  ctx.lineTo(acidEndX, bedY - 62);
  ctx.stroke();

  // Gelembung asam lambung
  ctx.fillStyle = "#BEF264";
  for (let i = 0; i < 6; i++) {
    const bx = lerp(520, acidEndX, (time * 0.8 + i * 0.18) % 1);
    const by = bedY - 62 + Math.sin(time * 9 + i) * 6;
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Panah aliran balik + Label "GERD / REFLUKS!" (lebar pill otomatis sesuai teks)
  if (refluxProg > 0.25) {
    const pulse = 1 + Math.sin(time * 10) * 0.05;
    const labelText = "⚠ ASAM LAMBUNG NAIK!";
    ctx.save();
    ctx.translate(width / 2, bedY - 210);
    ctx.scale(pulse, pulse);
    ctx.font = "900 34px Arial, sans-serif";
    const pillW = Math.max(520, ctx.measureText(labelText).width + 64);

    ctx.fillStyle = "#DC2626";
    drawRoundedRect(ctx, -pillW / 2, -42, pillW, 84, 20);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 0, 2);
    ctx.restore();
  }

  // Kartu dampak di bawah kasur
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  drawRoundedRect(ctx, 110, 1050, width - 220, 145, 22);
  ctx.fill();
  ctx.fillStyle = "#FDE047";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Dampak Langsung:", width / 2, 1098);
  ctx.fillStyle = "#F1F5F9";
  ctx.font = "bold 27px Arial, sans-serif";
  ctx.fillText("Dada panas (GERD) • Tidur tidak nyenyak", width / 2, 1148);
}

/**
 * BABAK 5 (BAGAIMANA): Timeline Jam Tidur & Aturan Jeda 2-3 Jam (21.8s - 32.0s)
 */
function drawSafeRuleAct(ctx, time, width, height) {
  const reveal = progress(time, 31.1, 32.5, easeOutCubic);

  ctx.fillStyle = "#4ADE80";
  ctx.font = "900 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ATURAN AMAN MAKAN MALAM", width / 2, 265);

  ctx.fillStyle = "#CBD5E1";
  ctx.font = "bold 25px Arial, sans-serif";
  ctx.fillText("Patokannya jam tidurmu, bukan jam 7!", width / 2, 312);

  // Kartu Timeline Jam Tidur
  const cardX = 80;
  const cardY = 390;
  const cardW = width - 160;
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  drawRoundedRect(ctx, cardX, cardY, cardW, 430, 28);
  ctx.fill();
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, cardX, cardY, cardW, 430, 28);
  ctx.stroke();

  // Bar Timeline: Zona Aman (Hijau) | Zona Jeda 2-3 Jam (Merah/Oranye) | Tidur
  const barX = 135;
  const barY = 555;
  const barW = width - 270;
  const safeW = barW * 0.56 * reveal;
  const gapW = barW * 0.44 * reveal;

  // Zona Aman
  ctx.fillStyle = "#22C55E";
  drawRoundedRect(ctx, barX, barY, Math.max(10, safeW), 56, 14);
  ctx.fill();

  // Zona Jeda 2-3 Jam sebelum tidur
  ctx.fillStyle = "#EF4444";
  drawRoundedRect(ctx, barX + barW * 0.56, barY, Math.max(10, gapW), 56, 14);
  ctx.fill();

  // Label di atas bar
  ctx.fillStyle = "#86EFAC";
  ctx.font = "900 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✓ AMAN MAKAN BERAT", barX + barW * 0.28, barY - 26);

  ctx.fillStyle = "#FCA5A5";
  ctx.fillText("⏳ JEDA 2–3 JAM", barX + barW * 0.78, barY - 26);

  // Contoh jam di bawah bar
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("19:00", barX, barY + 98);
  ctx.textAlign = "center";
  ctx.fillText("Batas Akhir", barX + barW * 0.56, barY + 98);
  ctx.textAlign = "right";
  ctx.fillStyle = "#FEF08A";
  ctx.fillText("22:00 TIDUR 🌙", barX + barW, barY + 98);

  // Contoh fleksibel
  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "(Kalau tidur jam 00:00, makan jam 21:00 tetap aman!)",
    width / 2,
    barY + 185,
  );

  // 2 Poin Checklist Praktis di bawah kartu
  const check1 = progress(time, 36.2, 37.0, easeOutBack);
  const check2 = progress(time, 33.8, 34.6, easeOutBack);

  if (check1 > 0.01) {
    drawChecklistPill(
      ctx,
      width / 2,
      915,
      "✓  Fokus total kalori harian",
      check1,
    );
  }
  if (check2 > 0.01) {
    drawChecklistPill(
      ctx,
      width / 2,
      1020,
      "✓  Beri jeda 2–3 jam sebelum rebahan",
      check2,
    );
  }
}

function drawChecklistPill(ctx, cx, cy, text, pop) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(clamp(pop, 0.01, 1.03), clamp(pop, 0.01, 1.03));
  ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
  drawRoundedRect(ctx, -380, -38, 760, 76, 38);
  ctx.fill();
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, -380, -38, 760, 76, 38);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.62;
  const pulse = 1 + Math.sin(time * 7) * 0.035;
  const scale = clamp(pop, 0.01, 1.08) * pulse;

  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const w = 420;
  const h = 104;
  ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#EF4444";
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 52);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 52);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 44px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+ FOLLOW", 0, 2);
  ctx.restore();
}
