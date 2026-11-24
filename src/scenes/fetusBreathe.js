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
 * Film Animasi Medis 1-Shot Sinematik (48 Detik):
 * "Bagaimana Janin dalam Kandungan Bisa Bernafas?"
 *
 * 1 Dunia Anatomi Bersambung (y = 200 .. 1550) — gaya ilustrasi medis lembut (TED-Ed / Kurzgesagt):
 *  - Shot 1 (0.0 -  6.5s) : Dalam rahim hangat — janin mengapung di cairan ketuban + Shock Hook
 *  - Shot 2 (6.5 - 13.5s) : Kamera PAN NAIK ke paru-paru ibu -> O2 masuk ke darah ibu mengalir turun
 *  - Shot 3 (13.5 - 24.5s): Kamera ZOOM ke membran Plasenta -> difusi O2 masuk & CO2 keluar (darah tidak bercampur!)
 *  - Shot 4 (24.5 - 33.5s): Kamera mengikuti Tali Pusat spiral -> aliran O2 menuju jantung janin berdetak
 *  - Shot 5 (33.5 - 44.5s): Momen kelahiran -> paru-paru bayi mengembang menghirup udara pertama kali!
 *  - Shot 6 (44.5 - 48.0s): Pull-out hangat + CTA "+ FOLLOW"
 */

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 520, y: 1120, zoom: 1.12 },
  { time: 8.6, x: 520, y: 1120, zoom: 1.12 },
  { time: 9.8, x: 540, y: 490, zoom: 1.18, ease: easeInOutCubic },   // Pan naik ke paru-paru ibu!
  { time: 13.4, x: 540, y: 490, zoom: 1.18 },
  { time: 14.8, x: 755, y: 1030, zoom: 1.72, ease: easeInOutCubic }, // Zoom ke membran Plasenta (difusi O2/CO2)
  { time: 25.4, x: 755, y: 1030, zoom: 1.72 },
  { time: 26.8, x: 575, y: 1140, zoom: 1.48, ease: easeInOutCubic }, // Ikuti Tali Pusat ke jantung janin
  { time: 33.2, x: 520, y: 1120, zoom: 1.45 },
  { time: 34.6, x: 465, y: 1105, zoom: 1.65, ease: easeInOutCubic }, // Fokus paru-paru bayi mengembang saat lahir!
  { time: 41.8, x: 465, y: 1105, zoom: 1.65 },
  { time: 43.2, x: 540, y: 980, zoom: 0.96, ease: easeInOutCubic },  // Pull-out hangat + Follow
  { time: 46.0, x: 540, y: 980, zoom: 0.96 },
];

const rand = createRandom(2029);
const FLUID_BUBBLES = Array.from({ length: 24 }, () => ({
  angle: rand() * Math.PI * 2,
  dist: 70 + rand() * 195,
  r: 4 + rand() * 8,
  speed: 0.3 + rand() * 0.6,
  phase: rand() * Math.PI * 2,
}));

function drawAutoPill(ctx, cx, cy, text, font, bgColor, textColor, borderColor = null, h = 64) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(200, ctx.measureText(text).width + 54);
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

export function drawFetusBreatheScene(ctx, time, width, height) {
  const birthGlow = progress(time, 34.5, 37.5, easeInOutCubic);

  // 1. Latar gradien hangat & lembut (berubah jadi cahaya keemasan saat napas pertama!)
  const bgTop = lerpColor('#1E1128', '#16283D', birthGlow);
  const bgBot = lerpColor('#3A1732', '#264661', birthGlow);
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, bgTop);
  bgGrad.addColorStop(1, bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 2. Siluet Tubuh Ibu (lembut & sopan, latar anatomi menyambung dari paru-paru ke rahim)
  drawMotherSilhouette(ctx);

  // 3. Paru-Paru Ibu (y = 480) + Pembuluh Darah Turun ke Plasenta
  drawMotherLungsAndVessel(ctx, time);

  // 4. Rahim & Cairan Ketuban (x = 520, y = 1130)
  drawWombAndFluid(ctx, time, birthGlow);

  // 5. Plasenta & Membran Difusi O2/CO2 (x = 760, y = 1035)
  drawPlacentaMembrane(ctx, time);

  // 6. Tali Pusat Spiral (menghubungkan Plasenta x=725 -> Janin x=480)
  drawUmbilicalCord(ctx, time, birthGlow);

  // 7. Janin / Bayi + Detak Jantung + Paru-Paru Mengembang saat Lahir!
  drawFetusAndLungs(ctx, time, birthGlow);

  ctx.restore();

  // 8. Overlay Hook (0.0 - 4.5s), Label Tali Pusat (26.0 - 33.2s), & CTA Follow (42.3 - 46.0s)
  if (time < 4.6) {
    drawWombHook(ctx, time, width, height);
  }
  if (time >= 26.0 && time <= 33.2) {
    const a = progress(time, 26.0, 26.5) * (1 - progress(time, 32.6, 33.2));
    ctx.save();
    ctx.globalAlpha = a;
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.22,
      'TALI PUSAT = SELANG OKSIGEN',
      '900 30px Arial, sans-serif',
      'rgba(15, 23, 42, 0.9)',
      '#7DD3FC',
      '#38BDF8',
      62
    );
    ctx.restore();
  }
  if (time >= 42.3) {
    const pop = progress(time, 42.5, 43.1, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawMotherSilhouette(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 196, 214, 0.08)';
  ctx.strokeStyle = 'rgba(255, 196, 214, 0.2)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(220, 220);
  ctx.quadraticCurveTo(540, 150, 860, 220);
  ctx.lineTo(920, 820);
  ctx.quadraticCurveTo(960, 1180, 840, 1520);
  ctx.lineTo(240, 1520);
  ctx.quadraticCurveTo(140, 1180, 180, 820);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * PARU-PARU IBU (y = 480) + Aliran O2 ke Darah Ibu -> Turun ke Plasenta
 */
function drawMotherLungsAndVessel(ctx, time) {
  const cx = 540;
  const ly = 485;
  const breath = 1 + Math.sin(time * 2.2) * 0.06;

  // Batang tenggorokan (trakea dengan cincin tulang rawan realistis)
  ctx.fillStyle = '#CBD5E1';
  drawRoundedRect(ctx, cx - 15, 255, 30, ly - 305, 10);
  ctx.fill();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  for (let ty = 272; ty < ly - 60; ty += 16) {
    ctx.beginPath();
    ctx.moveTo(cx - 14, ty);
    ctx.lineTo(cx + 14, ty);
    ctx.stroke();
  }

  // Paru-paru anatomis kiri & kanan ibu mengembang-mengempis
  ctx.save();
  ctx.translate(cx, ly);
  ctx.scale(breath, breath);

  // Cabang bronkus utama (Y terbalik dari trakea ke kedua paru)
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -56);
  ctx.quadraticCurveTo(-24, -36, -68, -14);
  ctx.moveTo(0, -56);
  ctx.quadraticCurveTo(24, -36, 68, -14);
  ctx.stroke();

  const drawAnatomicalLobe = (side) => {
    // side = -1 (kiri) atau +1 (kanan)
    const g = ctx.createRadialGradient(side * 75, -20, 14, side * 85, 10, 155);
    g.addColorStop(0, '#FDA4AF');
    g.addColorStop(0.6, '#F43F5E');
    g.addColorStop(1, '#BE123C');
    ctx.fillStyle = g;

    // Bentuk siluet paru-paru asli (puncak membulat, sisi luar cembung, dasar cekung diafragma)
    ctx.beginPath();
    ctx.moveTo(side * 24, -55);
    ctx.bezierCurveTo(side * 42, -135, side * 125, -130, side * 152, -38);
    ctx.bezierCurveTo(side * 176, 42, side * 168, 118, side * 128, 126);
    ctx.bezierCurveTo(side * 86, 134, side * 52, 106, side * 24, 104); // Dasar cekung diafragma
    ctx.bezierCurveTo(side * 14, 65, side * 32, 35, side * 22, -5);     // Lekuk jantung (cardiac notch)
    ctx.closePath();
    ctx.fill();

    // Garis pemisah lobus paru (fissure) yang halus
    ctx.strokeStyle = 'rgba(136, 19, 55, 0.35)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(side * 34, 12);
    ctx.quadraticCurveTo(side * 96, -4, side * 150, 26);
    ctx.stroke();

    // Pohon bronkiolus bercabang lembut di dalam paru-paru
    ctx.strokeStyle = 'rgba(255, 241, 242, 0.45)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(side * 34, -18);
    ctx.lineTo(side * 88, 6);
    ctx.moveTo(side * 68, -4);
    ctx.lineTo(side * 96, -54);
    ctx.moveTo(side * 88, 6);
    ctx.lineTo(side * 124, -18);
    ctx.moveTo(side * 88, 6);
    ctx.lineTo(side * 114, 68);
    ctx.moveTo(side * 72, 12);
    ctx.lineTo(side * 66, 72);
    ctx.stroke();

    // Alveoli berkilau lembut saat O2 masuk
    const o2Pulse = 0.4 + 0.6 * Math.abs(Math.sin(time * 2.2));
    ctx.fillStyle = `rgba(125, 211, 252, ${0.55 * o2Pulse})`;
    for (const [ax, ay] of [[98, -56], [126, -18], [116, 70], [66, 74]]) {
      ctx.beginPath();
      ctx.arc(side * ax, ay, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  drawAnatomicalLobe(-1);
  drawAnatomicalLobe(1);
  ctx.restore();

  // Partikel O2 biru cerah masuk lewat trakea saat ibu menarik napas
  ctx.fillStyle = '#38BDF8';
  for (let i = 0; i < 5; i++) {
    const c = (time * 0.7 + i * 0.2) % 1;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(time * 4 + i) * 5, lerp(255, ly - 20, c), 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pembuluh Darah Arteri Ibu turun dari paru-paru (cx, 580) -> Plasenta (790, 990)
  ctx.strokeStyle = 'rgba(225, 29, 72, 0.75)';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 45, ly + 85);
  ctx.bezierCurveTo(cx + 165, 680, 830, 760, 795, 990);
  ctx.stroke();

  // Tetesan O2 (cyan) mengalir turun di pembuluh darah ibu menuju plasenta
  ctx.fillStyle = '#7DD3FC';
  for (let i = 0; i < 8; i++) {
    const t = (time * 0.45 + i / 8) % 1;
    const inv = 1 - t;
    const px =
      inv * inv * inv * (cx + 45) +
      3 * inv * inv * t * (cx + 165) +
      3 * inv * t * t * 830 +
      t * t * t * 795;
    const py =
      inv * inv * inv * (ly + 85) +
      3 * inv * inv * t * 680 +
      3 * inv * t * t * 760 +
      t * t * t * 990;
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label diegetik saat kamera di paru-paru ibu (7s - 13.5s)
  if (time >= 7.0 && time <= 13.8) {
    drawAutoPill(
      ctx,
      cx,
      305,
      'PARU-PARU IBU (MENGHIRUP O₂)',
      '900 22px Arial, sans-serif',
      'rgba(15, 23, 42, 0.85)',
      '#7DD3FC',
      '#38BDF8',
      46
    );
  }
}

/**
 * RAHIM & CAIRAN KETUBAN (x = 520, y = 1130)
 */
function drawWombAndFluid(ctx, time, birthGlow) {
  const cx = 520;
  const cy = 1130;

  // Dinding luar rahim
  const wallG = ctx.createRadialGradient(cx, cy, 180, cx, cy, 340);
  wallG.addColorStop(0, '#9D174D');
  wallG.addColorStop(1, '#4C0519');
  ctx.fillStyle = wallG;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 315, 335, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kantung cairan ketuban hangat (memudar cerah saat lahir di t > 34.5s)
  const fluidTop = lerpColor('#5B2142', '#38BDF8', birthGlow * 0.55);
  const fluidBot = lerpColor('#31122E', '#0284C7', birthGlow * 0.55);
  const fGrad = ctx.createRadialGradient(cx - 40, cy - 60, 30, cx, cy, 295);
  fGrad.addColorStop(0, fluidTop);
  fGrad.addColorStop(1, fluidBot);
  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 278, 298, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gelembung cairan ketuban lembut melayang
  ctx.fillStyle = 'rgba(255, 230, 240, 0.22)';
  for (const b of FLUID_BUBBLES) {
    const a = b.angle + Math.sin(time * b.speed + b.phase) * 0.15;
    const bx = cx + Math.cos(a) * b.dist;
    const by = cy + Math.sin(a) * b.dist + Math.sin(time * 1.5 + b.phase) * 10;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * PLASENTA & MEMBRAN DIFUSI (x = 760, y = 1035):
 * Menunjukkan darah ibu & janin TIDAK bercampur — hanya O2 & CO2 yang bertukar!
 */
function drawPlacentaMembrane(ctx, time) {
  const px = 762;
  const py = 1035;

  ctx.save();
  ctx.translate(px, py);

  // Bentuk cakram plasenta menempel di dinding kanan rahim
  const pGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 120);
  pGrad.addColorStop(0, '#FB7185');
  pGrad.addColorStop(1, '#BE123C');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 74, 128, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Garis membran tipis pemisah darah ibu (kanan) & darah janin (kiri)
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(4, -95);
  ctx.quadraticCurveTo(-8, 0, 4, 95);
  ctx.stroke();
  ctx.setLineDash([]);

  // Animasi Difusi: O2 (cyan) menyeberang dari kanan (ibu) ke kiri (janin)
  for (let i = 0; i < 6; i++) {
    const cyc = (time * 0.75 + i * 0.17) % 1;
    const ox = lerp(42, -44, cyc);
    const oy = -70 + i * 28;
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animasi Difusi balik: CO2 (ungu muda) keluar dari kiri (janin) ke kanan (ibu)
  for (let i = 0; i < 5; i++) {
    const cyc = (time * 0.65 + i * 0.21) % 1;
    const ox = lerp(-42, 44, cyc);
    const oy = -55 + i * 28;
    ctx.fillStyle = '#C084FC';
    ctx.beginPath();
    ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Label diegetik saat zoom di plasenta (14.4s - 25.5s)
  if (time >= 14.4 && time <= 25.5) {
    drawAutoPill(
      ctx,
      px - 20,
      py - 160,
      'PLASENTA: O₂ MASUK ◄  ► CO₂ KELUAR',
      '900 18px Arial, sans-serif',
      'rgba(15, 23, 42, 0.9)',
      '#FDE047',
      '#FB7185',
      42
    );
  }
}

/**
 * TALI PUSAT SPIRAL (Menghubungkan Plasenta -> Perut Janin)
 */
function drawUmbilicalCord(ctx, time, birthGlow) {
  const cordFade = 1 - progress(time, 35.0, 36.8);
  if (cordFade <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = cordFade;

  const p0 = { x: 705, y: 1055 };
  const p1 = { x: 645, y: 1235 };
  const p2 = { x: 585, y: 1125 };
  const p3 = { x: 532, y: 1175 };

  // Pembungkus transparan tali pusat
  ctx.strokeStyle = 'rgba(253, 164, 175, 0.45)';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  ctx.stroke();

  // Pembuluh Vena pembawa O2 merah cerah
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y - 3);
  ctx.bezierCurveTo(p1.x, p1.y - 4, p2.x, p2.y - 4, p3.x, p3.y - 2);
  ctx.stroke();

  // Pembuluh Arteri pembawa CO2 biru-ungu
  ctx.strokeStyle = '#8B5CF6';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + 5);
  ctx.bezierCurveTo(p1.x, p1.y + 6, p2.x, p2.y + 6, p3.x, p3.y + 4);
  ctx.stroke();

  // Partikel O2 terang meluncur sepanjang tali pusat menuju janin!
  ctx.fillStyle = '#7DD3FC';
  for (let i = 0; i < 6; i++) {
    const t = (time * 0.65 + i / 6) % 1;
    const inv = 1 - t;
    const bx =
      inv * inv * inv * p0.x +
      3 * inv * inv * t * p1.x +
      3 * inv * t * t * p2.x +
      t * t * t * p3.x;
    const by =
      inv * inv * inv * p0.y +
      3 * inv * inv * t * p1.y +
      3 * inv * t * t * p2.y +
      t * t * t * p3.y;
    ctx.beginPath();
    ctx.arc(bx, by - 3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * JANIN / BAYI BESAR & ANATOMIS (Posisi Meringkuk Khas Bayi di Rahim):
 * Kepala profil samping (dahi, hidung mungil, pipi chubby, mata terpejam, telinga, rambut tipis),
 * badan melengkung, tangan terlipat dekat dagu, kaki & telapak kaki mungil, + jantung & paru-paru!
 */
function drawFetusAndLungs(ctx, time, birthGlow) {
  const fx = 468;
  const fy = 1135 + Math.sin(time * 1.4) * 7;

  ctx.save();
  ctx.translate(fx, fy);
  ctx.scale(1.22, 1.22);

  // Gradien kulit bayi hangat lembut
  const skinG = ctx.createRadialGradient(-18, -40, 20, 0, 10, 180);
  skinG.addColorStop(0, '#FFE4C4');
  skinG.addColorStop(0.6, '#FED0A6');
  skinG.addColorStop(1, '#F3A878');

  const skinDark = '#E69566';

  // --- 1. Kaki belakang (sedikit lebih gelap untuk kedalaman) ---
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.ellipse(26, 98, 42, 24, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // --- 2. Badan Bayi Melengkung (Posisi Janin C-Curve) ---
  ctx.fillStyle = skinG;
  ctx.beginPath();
  ctx.moveTo(-42, -35);
  ctx.bezierCurveTo(-92, 15, -88, 102, -22, 128); // Punggung melengkung halus
  ctx.bezierCurveTo(32, 146, 66, 112, 62, 62);    // Pantat & perut bawah
  ctx.bezierCurveTo(60, 15, 42, -22, 14, -42);    // Dada & perut depan
  ctx.closePath();
  ctx.fill();

  // Shading halus di punggung
  ctx.strokeStyle = 'rgba(180, 90, 50, 0.22)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // --- 3. Kaki Depan Terlipat (Paha chubby + Betis + Telapak Kaki Mungil) ---
  ctx.fillStyle = skinG;
  // Paha
  ctx.beginPath();
  ctx.ellipse(18, 96, 48, 28, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // Betis menekuk ke bawah
  ctx.beginPath();
  ctx.ellipse(46, 122, 34, 18, 0.72, 0, Math.PI * 2);
  ctx.fill();
  // Telapak kaki mungil dengan tumit & jari
  ctx.beginPath();
  ctx.ellipse(68, 134, 22, 12, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 90, 50, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // --- 4. Kepala Profil Samping Bayi (Besar & Imut Proporsi Bayi) ---
  ctx.save();
  ctx.translate(-12, -96);

  // Bentuk kepala + dahi bulat + pipi chubby
  ctx.fillStyle = skinG;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fill();

  // Pipi & dagu profil kanan menghadap tali pusat
  ctx.beginPath();
  ctx.ellipse(38, 22, 34, 30, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Hidung kancing mungil di sisi kanan wajah
  ctx.beginPath();
  ctx.arc(68, 8, 10, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.fill();

  // Pipi merona merah muda lembut
  ctx.fillStyle = 'rgba(244, 114, 138, 0.32)';
  ctx.beginPath();
  ctx.ellipse(42, 22, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Telinga mungil di tengah-kiri kepala
  ctx.fillStyle = '#F7B88B';
  ctx.beginPath();
  ctx.ellipse(-8, 12, 12, 17, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 75, 45, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-7, 12, 6, -1.2, 1.4);
  ctx.stroke();

  // Helai rambut bayi halus di puncak kepala
  ctx.strokeStyle = '#7C4A2D';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -66);
  ctx.quadraticCurveTo(10, -82, 24, -68);
  ctx.moveTo(6, -64);
  ctx.quadraticCurveTo(22, -76, 32, -62);
  ctx.stroke();

  // Alis & Mata terpejam damai dengan bulu mata lentik
  ctx.strokeStyle = '#6B3418';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(40, -10, 11, Math.PI * 1.15, Math.PI * 1.85); // Alis halus
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(42, 2, 11, 0.15, Math.PI - 0.15); // Kelopak mata terpejam
  ctx.stroke();

  // Mulut mungil (terpejam damai -> terbuka kecil "o" saat menangis napas pertama!)
  if (birthGlow > 0.3) {
    ctx.fillStyle = '#BE123C';
    ctx.beginPath();
    ctx.ellipse(57, 32, 8 * birthGlow, 10 * birthGlow, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#9A4830';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(54, 29, 7, 0.3, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();

  // --- 5. Lengan & Tangan Mungil Terlipat di Dekat Dagu ---
  ctx.fillStyle = skinG;
  // Lengan atas
  ctx.beginPath();
  ctx.ellipse(12, 8, 22, 34, -0.45, 0, Math.PI * 2);
  ctx.fill();
  // Lengan bawah naik ke dagu
  ctx.beginPath();
  ctx.ellipse(42, -16, 26, 15, -0.65, 0, Math.PI * 2);
  ctx.fill();
  // Tangan mungil mengepal lembut dekat pipi
  ctx.beginPath();
  ctx.arc(58, -32, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 90, 50, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // --- 6. Organ Dalam X-Ray Halus: Jantung Berdetak & Paru-Paru Mengembang ---
  // Jantung mungil janin berdetak (~140 bpm visual lembut)
  const beat = 1 + Math.pow(Math.max(0, Math.sin(time * 7.2)), 4) * 0.24;
  ctx.save();
  ctx.translate(12, 14);
  ctx.scale(beat, beat);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(-6, -4, 8, 0, Math.PI * 2);
  ctx.arc(6, -4, 8, 0, Math.PI * 2);
  ctx.moveTo(-13, -1);
  ctx.lineTo(0, 13);
  ctx.lineTo(13, -1);
  ctx.fill();
  ctx.restore();

  // PARU-PARU BAYI: kecil redup di rahim -> MENGEMBANG BIRU CERAH saat lahir (t >= 34.5s)!
  const lungScale = lerp(0.6, 1.3 + Math.sin(time * 4) * 0.08, birthGlow);
  ctx.save();
  ctx.translate(-16, 18);
  ctx.scale(lungScale, lungScale);
  ctx.fillStyle = lerpColor('#9D174D', '#38BDF8', birthGlow);
  ctx.globalAlpha = lerp(0.55, 0.95, birthGlow);
  ctx.beginPath();
  ctx.ellipse(-14, 0, 15, 25, 0.15, 0, Math.PI * 2);
  ctx.ellipse(14, 0, 15, 25, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Gelombang cahaya biru-emas saat Tangisan & Napas Pertama!
  if (birthGlow > 0.15) {
    const wave = (time * 1.1) % 1;
    ctx.strokeStyle = `rgba(125, 211, 252, ${(1 - wave) * 0.75 * birthGlow})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-10, 14, 32 + wave * 125, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // Label diegetik saat napas pertama (34.5s - 42.0s)
  if (time >= 34.5 && time <= 42.0) {
    drawAutoPill(
      ctx,
      fx,
      fy - 225,
      '✨ NAPAS PERTAMA: PARU-PARU MULAI BEKERJA!',
      '900 18px Arial, sans-serif',
      'rgba(2, 132, 199, 0.92)',
      '#FFFFFF',
      '#BAE6FD',
      42
    );
  }
}

function drawWombHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.9, 4.5, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;
  ctx.translate(width / 2, height * 0.21);
  ctx.scale(clamp(enter, 0.01, 1.05), clamp(enter, 0.01, 1.05));

  drawAutoPill(
    ctx,
    0,
    -88,
    '🤯 KEAJAIBAN TUBUH MANUSIA',
    '900 34px Arial, sans-serif',
    '#BE123C',
    '#FDE047',
    '#FDE047',
    70
  );

  ctx.lineJoin = 'round';
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.font = '900 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('TERENDAM CAIRAN 9 BULAN,', 0, 10);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('TERENDAM CAIRAN 9 BULAN,', 0, 10);

  ctx.strokeText('KOK JANIN TAK TENGGELAM?', 0, 72);
  ctx.fillStyle = '#FFD43B';
  ctx.fillText('KOK JANIN TAK TENGGELAM?', 0, 72);
  ctx.restore();
}

function drawFollowCTA(ctx, width, height, pop, time) {
  ctx.save();
  const cx = width / 2;
  const cy = height * 0.26;
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
