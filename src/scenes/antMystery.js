import { applyCamera, evaluateCamera } from "../engine/camera.js";
import {
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  progress,
} from "../engine/math.js";
import { drawRoundedRect } from "../engine/shapes.js";

/**
 * Film Animasi 1-Shot Sinematik 3D-Stylized (68 Detik — Masalah + Rahasia Biologis + Solusi):
 * "Bagaimana Semut Bisa Menemukan Makanan di Tempat Tertutup & Tinggi?"
 *
 * Alur 4 Babak:
 *  - Babak 1 (0.0 - 14.0s) : Masalah — Toples kue ditaruh di rak tinggi & ditutup, tapi semut pengintai (scout ant) sudah berpatroli!
 *  - Babak 2 (14.0 - 36.0s): Macro Zoom Rahasia — Antena mencium aroma dari celah tutup 1mm, kaki lengket (arolium) memanjat kaca, lalu meninggalkan JEJAK FEROMON memanggil pasukan semut!
 *  - Babak 3 (36.0 - 45.0s): Dampak — Toples penuh semut, pemilik rumah kaget!
 *  - Babak 4 (45.0 - 68.0s): Solusi — Lap jalur feromon pakai air sabun/cuka (semut bingung & balik) + ganti toples SEAL KARET KEDAP UDARA (aroma & celah tertutup 100%) + "+ FOLLOW"
 */

const COUNTER_Y = 1180;
const SHELF_Y = 740;
const JAR_X = 370;
const JAR_Y = SHELF_Y; // dasar toples di atas rak tinggi (y = 740)

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 940, zoom: 1.0 }, // Babak 1 (0-13.7s): Wide Dapur + Rak Tinggi
  { time: 13.4, x: 540, y: 940, zoom: 1.0 },
  { time: 14.8, x: 375, y: 635, zoom: 2.15, ease: easeInOutCubic }, // Babak 2A (13.8-26.8s): Macro Celah 1mm & Kaki Semut
  { time: 26.2, x: 375, y: 635, zoom: 2.15 },
  { time: 27.6, x: 380, y: 880, zoom: 1.42, ease: easeInOutCubic }, // Babak 2B (26.9-39.8s): Jejak Feromon Glowing & Pasukan Semut!
  { time: 39.2, x: 380, y: 880, zoom: 1.42 },
  { time: 40.4, x: 540, y: 940, zoom: 1.0, ease: easeInOutCubic }, // Babak 3 (39.9-47.9s): Wide — Pemilik Kaget Toples Penuh Semut!
  { time: 47.6, x: 540, y: 940, zoom: 1.0 },
  { time: 49.0, x: 460, y: 910, zoom: 1.24, ease: easeInOutCubic }, // Babak 4A (48.0-58.0s): Solusi 1 — Lap Air Sabun/Cuka Hapus Feromon
  { time: 58.2, x: 375, y: 635, zoom: 2.0, ease: easeInOutCubic }, // Babak 4B (58.1-65.5s): Macro Solusi 2 — Toples Seal Karet Kedap!
  { time: 64.2, x: 375, y: 635, zoom: 2.0 },
  { time: 65.6, x: 540, y: 940, zoom: 1.0, ease: easeInOutCubic }, // Penutup (66.0-69.0s): Dapur Aman & CTA Follow
  { time: 69.0, x: 540, y: 940, zoom: 1.0 },
];

// Jalur semut dari sarang (bawah kiri) -> naik dinding -> rak tinggi -> tutup toples!
const ANT_PATH = [
  { x: 115, y: 1210 },
  { x: 155, y: 1120 },
  { x: 170, y: 960 },
  { x: 185, y: 760 },
  { x: 280, y: 732 },
  { x: 315, y: 640 },
  { x: 350, y: 558 },
];

function samplePath(t) {
  const ct = clamp(t, 0, 1);
  const segCount = ANT_PATH.length - 1;
  const scaled = ct * segCount;
  const idx = Math.min(segCount - 1, Math.floor(scaled));
  const localT = scaled - idx;
  const a = ANT_PATH[idx];
  const b = ANT_PATH[idx + 1];
  return {
    x: lerp(a.x, b.x, localT),
    y: lerp(a.y, b.y, localT),
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
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
  h = 54,
) {
  ctx.save();
  ctx.font = font;
  const w = Math.max(200, ctx.measureText(text).width + 48);
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

export function drawAntMysteryScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Dapur 3D-Stylized Hangat & Rak Tinggi
  drawKitchenBackdrop(ctx, time);

  // 2. Jejak Feromon Glowing (muncul Babak 2B, terhapus saat dilap air sabun di Babak 4A!)
  drawPheromoneTrail(ctx, time);

  // 3. Toples Kue/Gula di Rak Tinggi (Tutup Ulir Celah 1mm vs Tutup Seal Karet Kedap Udara di Babak 4B!)
  drawCookieJar(ctx, time);

  // 4. Semut Pengintai & Pasukan Semut (dengan antena & kaki arolium!)
  drawAntsSystem(ctx, time);

  // 5. Karakter Pemilik Rumah 3D Clay-Toy (menaruh toples, kaget, menyemprot/lap air sabun, lalu senang!)
  drawHomeowner3D(ctx, time);

  ctx.restore();

  // 6. Pill Status Screen-Space di atas layar (y = 17%, aman 100% dari subtitle bawah!)
  const pill = getStatusPill(time);
  if (pill) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.17,
      pill.text,
      "900 26px Arial, sans-serif",
      pill.bg,
      pill.color,
      pill.border,
      54,
    );
  }

  // 7. CTA Follow di akhir (65.8s+)
  if (time >= 65.8) {
    const pop = progress(time, 66.0, 66.6, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function getStatusPill(time) {
  if (time >= 14.0 && time <= 26.8) {
    return {
      text: "🔍 CELAH 1 MM • KAKI LENGKET & ANTENA",
      bg: "rgba(15, 23, 42, 0.92)",
      color: "#FDE047",
      border: "#38BDF8",
    };
  }
  if (time >= 27.0 && time <= 39.8) {
    return {
      text: "✨ JALAN TOL GPS: JEJAK FEROMON!",
      bg: "rgba(162, 28, 175, 0.92)",
      color: "#FFFFFF",
      border: "#F0ABFC",
    };
  }
  if (time >= 48.5 && time <= 57.8) {
    return {
      text: "🧼 SOLUSI 1: LAP AIR SABUN / CUKA",
      bg: "rgba(2, 132, 199, 0.94)",
      color: "#FFFFFF",
      border: "#7DD3FC",
    };
  }
  if (time >= 58.1 && time <= 65.4) {
    return {
      text: "🛡️ SOLUSI 2: TOPLES SEAL KARET KEDAP",
      bg: "rgba(13, 148, 136, 0.94)",
      color: "#FFFFFF",
      border: "#99F6E4",
    };
  }
  return null;
}

function drawKitchenBackdrop(ctx, time) {
  // Dinding dapur krem hangat dengan pencahayaan 3D lembut
  const wallG = ctx.createLinearGradient(0, 0, 0, COUNTER_Y + 300);
  wallG.addColorStop(0, "#FEF9EF");
  wallG.addColorStop(1, "#EFE2CC");
  ctx.fillStyle = wallG;
  ctx.fillRect(-300, -150, 1700, 2200);

  // Keramik backsplash lembut di dinding
  ctx.strokeStyle = "rgba(180, 140, 100, 0.16)";
  ctx.lineWidth = 2;
  for (let x = -100; x <= 1200; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 420);
    ctx.lineTo(x, COUNTER_Y);
    ctx.stroke();
  }
  for (let y = 420; y <= COUNTER_Y; y += 72) {
    ctx.beginPath();
    ctx.moveTo(-100, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  // Jendela dapur cerah di kanan atas (x = 670 .. 980)
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, 680, 480, 290, 270, 16);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 12;
  ctx.stroke();

  // Rak Dinding Kayu Tinggi di kiri-tengah (y = SHELF_Y = 740)
  ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
  drawRoundedRect(ctx, 175, SHELF_Y + 18, 410, 18, 8);
  ctx.fill();
  const shelfG = ctx.createLinearGradient(0, SHELF_Y - 6, 0, SHELF_Y + 26);
  shelfG.addColorStop(0, "#B47B46");
  shelfG.addColorStop(1, "#784922");
  ctx.fillStyle = shelfG;
  drawRoundedRect(ctx, 165, SHELF_Y - 4, 420, 28, 8);
  ctx.fill();

  // Meja Dapur Bawah (y = COUNTER_Y = 1180)
  ctx.fillStyle = "#A16207";
  ctx.fillRect(-200, COUNTER_Y, 1500, 44);
  ctx.fillStyle = "#D6B28D";
  ctx.fillRect(-200, COUNTER_Y + 44, 1500, 750);

  // Celah sarang semut kecil di pojok kiri bawah meja (x = 115, y = 1210)
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.ellipse(115, 1212, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Jejak Feromon Neon Ungu-Pink di sepanjang dinding (muncul Babak 2B, terhapus saat dilap air sabun di Babak 4A!)
 */
function drawPheromoneTrail(ctx, time) {
  const layProg = progress(time, 27.0, 32.0, easeOutCubic);
  const wipeProg = progress(time, 49.5, 55.0, easeInOutCubic);
  const alpha = layProg * (1 - wipeProg);
  if (alpha <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = alpha * (0.75 + 0.25 * Math.sin(time * 6));
  ctx.strokeStyle = "#E879F9";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.setLineDash([12, 16]);
  ctx.beginPath();
  const maxStep = Math.floor(layProg * 36);
  for (let i = 0; i <= maxStep; i++) {
    const pt = samplePath(i / 36);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Partikel aroma feromon berkilau
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * layProg;
    const pt = samplePath(t);
    ctx.fillStyle = "#F5D0FE";
    ctx.beginPath();
    ctx.arc(pt.x + Math.sin(time * 5 + i) * 6, pt.y - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Busa sabun putih berkilau saat dinding dilap di Babak 4A (49.0s - 56.5s)!
  if (time >= 49.0 && time <= 56.5) {
    const foamA = progress(time, 49.0, 49.8) * (1 - progress(time, 55.6, 56.5));
    ctx.save();
    ctx.globalAlpha = foamA;
    for (let f = 0; f < 10; f++) {
      const pt = samplePath(0.15 + f * 0.07);
      ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
      ctx.beginPath();
      ctx.arc(
        pt.x + Math.sin(f * 3) * 16,
        pt.y,
        12 + (f % 3) * 5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Toples Kaca Kue/Gula di Rak Tinggi:
 * - Babak 1-3: Tutup biasa dengan celah mikro 1mm -> gelombang aroma manis bocor keluar!
 * - Babak 4B (53.5s+): Ganti Toples SEAL KARET KEDAP UDARA (toska) -> aroma tertahan 100% di dalam!
 */
function drawCookieJar(ctx, time) {
  const airtight = progress(time, 58.0, 59.2, easeOutBack);
  const cx = JAR_X;
  const baseY = JAR_Y - 4;

  ctx.save();
  ctx.translate(cx, baseY);

  // Bayangan lembut toples di rak
  ctx.fillStyle = "rgba(15, 23, 42, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 74, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kue kering / gula manis di dalam toples
  const cookies = [
    [-28, -32, 22],
    [26, -30, 21],
    [0, -48, 24],
    [-22, -74, 21],
    [22, -72, 20],
  ];
  for (const [kx, ky, kr] of cookies) {
    ctx.fillStyle = "#D97706";
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fill();
    // Choco chips
    ctx.fillStyle = "#451A03";
    ctx.beginPath();
    ctx.arc(kx - 6, ky - 4, 3.5, 0, Math.PI * 2);
    ctx.arc(kx + 7, ky + 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Badan kaca toples bening + kilau kaca
  ctx.fillStyle = "rgba(224, 242, 254, 0.34)";
  drawRoundedRect(ctx, -68, -168, 136, 168, 22);
  ctx.fill();
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 5;
  ctx.stroke();
  // Highlight refleksi kaca di kiri
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  drawRoundedRect(ctx, -56, -152, 12, 132, 6);
  ctx.fill();

  // Leher kaca toples berulir (agar celah tutup terlihat jelas!)
  ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
  drawRoundedRect(ctx, -56, -184, 112, 18, 4);
  ctx.fill();
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 3;
  ctx.stroke();
  // Garis ulir kaca
  ctx.strokeStyle = "rgba(100, 116, 139, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-54, -177);
  ctx.lineTo(54, -175);
  ctx.moveTo(-54, -171);
  ctx.lineTo(54, -169);
  ctx.stroke();

  // TUTUP TOPLES:
  // Awal (sebelum Solusi 2) -> tutup agak terangkat & miring tipis agar celah terbuka terlihat sangat jelas!
  // Solusi 2 -> Seal Karet Toska tebal & tutup menutup lurus rapat 0mm!
  const lidY = lerp(-198, -174, airtight);
  const lidTilt = lerp(-0.085, 0, airtight);

  if (airtight > 0.05) {
    // Ring Seal Karet Kedap Udara berwarna toska!
    ctx.fillStyle = "#0D9488";
    drawRoundedRect(ctx, -64, -182, 128, 16, 6);
    ctx.fill();
  } else {
    // Sorotan celah terbuka di antara leher kaca & tutup (terlihat jelas sejak awal & makin tegas saat Macro Zoom!)
    ctx.fillStyle =
      time >= 14.5 && time <= 23.5
        ? "rgba(239, 68, 68, 0.78)"
        : "rgba(245, 158, 11, 0.48)";
    ctx.fillRect(-58, -188, 116, 9);
    if (time >= 14.5 && time <= 23.5) {
      ctx.fillStyle = "#EF4444";
      ctx.font = "900 16px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("◀ CELAH ±1 MM", 72, -182);
    }
  }

  // Tutup atas toples (miring & terangkat tipis di awal, lalu rapat lurus saat seal karet terpasang)
  ctx.save();
  ctx.translate(0, lidY);
  ctx.rotate(lidTilt);
  ctx.fillStyle = airtight > 0.5 ? "#0F766E" : "#B45309";
  drawRoundedRect(ctx, -74, -22, 148, 28, 10);
  ctx.fill();
  ctx.strokeStyle = airtight > 0.5 ? "#5EEAD4" : "#78350F";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Gelombang Aroma Manis (bocor keluar sebelum seal karet, memantul aman di dalam setelah seal karet!)
  if (airtight < 0.4) {
    ctx.strokeStyle = "rgba(245, 158, 11, 0.72)";
    ctx.lineWidth = 3.5;
    for (let w = 0; w < 3; w++) {
      const cyc = (time * 0.75 + w * 0.33) % 1;
      const wy = -175 - cyc * 65;
      const wx = Math.sin(cyc * 6 + w) * 26;
      ctx.globalAlpha = (1 - cyc) * 0.85;
      ctx.beginPath();
      ctx.arc(wx, wy, 12 + cyc * 18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (time >= 54.0 && time <= 60.5) {
    // Aroma tertahan rapi di dalam toples (ikon centang hijau!)
    ctx.fillStyle = "#10B981";
    ctx.font = "900 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔒 0 MM CELAH", 0, -214);
  }

  ctx.restore();
}

/**
 * Sistem Semut:
 * - Babak 1-2A: 1 Semut Pengintai (Scout Ant) patroli -> mencium aroma -> memanjat kaca -> masuk celah 1mm
 * - Babak 2B-3: Pasukan 10 semut berbaris di jalur feromon & mengerubungi toples!
 * - Babak 4: Setelah feromon dilap, semut bingung & mundur kembali ke sarang!
 */
function drawAntsSystem(ctx, time) {
  const wiped = time >= 50.0;

  // 1. Semut Pengintai (Scout Ant) aktif dari t=2s sampai t=28s
  if (time >= 1.5 && time < 29.0) {
    let p = 0;
    if (time < 15.0) {
      p = progress(time, 1.5, 15.0, easeInOutCubic) * 0.86;
    } else if (time < 23.0) {
      // Menyelip di celah tutup toples!
      p = 0.86 + progress(time, 15.0, 21.5, easeInOutCubic) * 0.14;
    } else {
      // Pulang ke sarang sambil meneteskan feromon!
      p = 1.0 - progress(time, 23.0, 28.0, easeInOutCubic);
    }
    const pos = samplePath(p);
    drawAnt3D(
      ctx,
      pos.x,
      pos.y,
      time > 23.0 ? pos.angle + Math.PI : pos.angle,
      1.15,
      time,
    );
  }

  // 2. Pasukan Semut Berbaris di Jalan Tol Feromon (25.5s - 51.5s)
  if (time >= 25.5 && time < 52.5) {
    const antCount = 9;
    for (let i = 0; i < antCount; i++) {
      let prog = ((time - 25.5) * 0.16 - i * 0.09) % 1;
      if (prog < 0) continue;
      if (wiped) {
        // Setelah dilap air sabun, semut berbalik arah turun meninggalkan dinding!
        const retreat = progress(time, 50.0, 52.5);
        prog = Math.max(0, prog * (1 - retreat));
      }
      const pos = samplePath(prog);
      drawAnt3D(
        ctx,
        pos.x,
        pos.y,
        wiped ? pos.angle + Math.PI : pos.angle,
        0.95,
        time + i,
      );
    }
  }

  // 3. Semut berkerumun di sekitar kue di dalam toples (30s - 46s)
  if (time >= 30.0 && time < 46.5) {
    const swarmA =
      progress(time, 30.0, 32.0) * (1 - progress(time, 45.2, 46.5));
    ctx.save();
    ctx.globalAlpha = swarmA;
    for (let s = 0; s < 5; s++) {
      const ang = time * 1.4 + s * 1.25;
      const sx = JAR_X + Math.cos(ang) * 32;
      const sy = JAR_Y - 58 + Math.sin(ang * 1.3) * 26;
      drawAnt3D(ctx, sx, sy, ang + Math.PI / 2, 0.85, time + s);
    }
    ctx.restore();
  }
}

function drawAnt3D(ctx, x, y, angle, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const legWiggle = Math.sin(time * 24) * 3;
  // 6 Kaki halus (dengan bantalan lengket arolium di ujungnya!)
  ctx.strokeStyle = "#1E1B18";
  ctx.lineWidth = 2.2;
  for (let l = -1; l <= 1; l++) {
    ctx.beginPath();
    ctx.moveTo(l * 5, 0);
    ctx.lineTo(l * 8 + legWiggle * (l === 0 ? -1 : 1), -11);
    ctx.moveTo(l * 5, 0);
    ctx.lineTo(l * 8 - legWiggle * (l === 0 ? -1 : 1), 11);
    ctx.stroke();
  }

  // 3 Segmen Tubuh Semut 3D (Abdomen, Thorax, Head)
  ctx.fillStyle = "#3B1D0E";
  ctx.beginPath();
  ctx.ellipse(-11, 0, 7.5, 5.2, 0, 0, Math.PI * 2); // abdomen
  ctx.fill();
  ctx.fillStyle = "#5C2D16";
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 3.6, 0, 0, Math.PI * 2); // thorax
  ctx.fill();
  ctx.fillStyle = "#2B140A";
  ctx.beginPath();
  ctx.ellipse(9, 0, 4.8, 4.2, 0, 0, Math.PI * 2); // head
  ctx.fill();

  // 2 Antena bergerak aktif mendeteksi aroma!
  const antWave = Math.sin(time * 16) * 2.5;
  ctx.strokeStyle = "#1E1B18";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(19, -7 + antWave);
  ctx.moveTo(12, 2);
  ctx.lineTo(19, 7 - antWave);
  ctx.stroke();

  ctx.restore();
}

/**
 * Karakter Pemilik Rumah 3D Clay-Toy (menaruh toples, kaget, lap air sabun, lalu lega tersenyum!)
 */
function drawHomeowner3D(ctx, time) {
  let hx = 780;
  let mood = "smile";
  let tool = "none";

  if (time >= 39.8 && time < 48.2) {
    hx = 760;
    mood = "shock";
  } else if (time >= 48.2 && time < 57.5) {
    hx = lerp(760, 490, progress(time, 48.2, 49.6, easeInOutCubic));
    mood = "smile";
    tool = "sponge";
  } else if (time >= 57.5) {
    hx = lerp(490, 770, progress(time, 64.0, 65.8, easeInOutCubic));
    mood = "smile";
  }

  const baseY = COUNTER_Y;
  const bob = Math.sin(time * 3) * 3;

  ctx.save();
  ctx.translate(hx, baseY);

  // Badan (kaos biru lembut)
  const bodyG = ctx.createLinearGradient(-48, -210, 48, 0);
  bodyG.addColorStop(0, "#38BDF8");
  bodyG.addColorStop(1, "#0284C7");
  ctx.fillStyle = bodyG;
  drawRoundedRect(ctx, -48, -195 + bob, 96, 195, 28);
  ctx.fill();

  // Kepala bulat 3D smooth-shaded
  const headY = -242 + bob;
  const headG = ctx.createRadialGradient(-14, headY - 12, 8, 0, headY, 48);
  headG.addColorStop(0, "#FDE0C2");
  headG.addColorStop(0.75, "#E8B98E");
  headG.addColorStop(1, "#C9966B");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, headY, 44, 0, Math.PI * 2);
  ctx.fill();

  // Rambut rapi coklat tua
  ctx.fillStyle = "#2B1B17";
  ctx.beginPath();
  ctx.arc(0, headY - 12, 45, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();

  // Mata & Mulut minimalis imut
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(-14, headY + 2, 4.2, 0, Math.PI * 2);
  ctx.arc(12, headY + 2, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  if (mood === "shock") {
    ctx.arc(-1, headY + 18, 6.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(-1, headY + 12, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // Spons air sabun mengelap jalur feromon di Babak 4A!
  if (tool === "sponge") {
    const wipeX = -260 + Math.sin(time * 8) * 35;
    const wipeY = -260 + Math.cos(time * 6) * 45;
    ctx.strokeStyle = "#E8B98E";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-40, -165 + bob);
    ctx.lineTo(wipeX, wipeY);
    ctx.stroke();

    ctx.fillStyle = "#FACC15";
    drawRoundedRect(ctx, wipeX - 24, wipeY - 16, 48, 32, 8);
    ctx.fill();
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
