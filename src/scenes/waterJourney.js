import { applyCamera, evaluateCamera } from "../engine/camera.js";
import {
  clamp,
  createRandom,
  easeInOutCubic,
  easeOutBack,
  lerp,
  lerpColor,
  progress,
} from "../engine/math.js";
import {
  drawAnimatedPipe,
  drawBacteria,
  drawCloud,
  drawPalmTree,
  drawRoundedRect,
} from "../engine/shapes.js";

/**
 * Film Animasi Pendek 1-Shot Sinematik (48 Detik):
 * "Bagaimana Air Bisa Sampai ke Rumah Kita?"
 *
 * 1 Dunia Cross-Section Memanjang (x = 0 .. 3500) tanpa slide presentasi:
 *  - Shot 1 (0.0 -  6.5s) : Dapur rumah (x=3040) — air jernih mengucur dari keran ke gelas -> whip-pan ke hulu!
 *  - Shot 2 (6.5 - 13.5s) : Sungai pegunungan & Intake (x=420) — air sungai keruh disaring & disedot pompa
 *  - Shot 3 (13.5 - 23.0s): Instalasi Pengolahan Air / IPA (x=1260) — Koagulasi (aduk tawas) -> Sedimentasi -> Filtrasi pasir/karbon
 *  - Shot 4 (23.0 - 29.5s): Desinfeksi & Reservoir (x=1960) — Kuman lenyap oleh klorin terukur, air jernih disimpan
 *  - Shot 5 (29.5 - 37.5s): Pompa Distribusi & Menara Air + Pipa Bawah Tanah (x=2520) — air bertekanan meluncur ke rumah
 *  - Shot 6 (37.5 - 48.0s): Meteran Air -> Pipa Rumah -> Keran Dapur (x=3040) + CTA "+ FOLLOW"
 */

const GROUND_Y = 1040;

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 3060, y: 880, zoom: 1.2 },
  { time: 7.2, x: 3060, y: 880, zoom: 1.2 },
  { time: 8.6, x: 420, y: 940, zoom: 1.0, ease: easeInOutCubic }, // Whip-pan ke hulu sungai (Jalur 1: PDAM)
  { time: 14.8, x: 420, y: 940, zoom: 1.0 },
  { time: 16.2, x: 1260, y: 1020, zoom: 1.04, ease: easeInOutCubic }, // IPA: Koagulasi-Sedimentasi-Filtrasi
  { time: 23.4, x: 1340, y: 1020, zoom: 1.06 },
  { time: 24.8, x: 2240, y: 960, zoom: 0.92, ease: easeInOutCubic }, // Desinfeksi + Menara Air PDAM
  { time: 31.8, x: 2520, y: 960, zoom: 0.96 },
  { time: 33.4, x: 3250, y: 1260, zoom: 1.12, ease: easeInOutCubic }, // Jalur 2: Turun ke Akuifer & Sumur Bor di bawah rumah!
  { time: 40.4, x: 3250, y: 1260, zoom: 1.12 },
  { time: 41.8, x: 3240, y: 820, zoom: 0.96, ease: easeInOutCubic }, // Naik ikut pipa sumur ke Pompa & Toren atas rumah!
  { time: 47.4, x: 3180, y: 960, zoom: 1.0 },
  { time: 48.8, x: 3050, y: 940, zoom: 0.92, ease: easeInOutCubic }, // Zoom-out lihat 2 jalur (PDAM + Sumur) & pesan aman
  { time: 59.0, x: 3050, y: 940, zoom: 0.92 },
];

const rand = createRandom(8842);
const PEBBLES = Array.from({ length: 75 }, () => ({
  x: -200 + rand() * 3900,
  y: GROUND_Y + 85 + rand() * 780,
  rx: 5 + rand() * 14,
  ry: 4 + rand() * 8,
  color: rand() > 0.5 ? "#9A6B52" : "#6A3E2A",
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
  h = 68,
) {
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 2);
  ctx.restore();
}

export function drawWaterJourneyScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar Langit, Pegunungan, Rumput & Cross-Section Tanah Memanjang (x = -300 .. 3900)
  drawContinuousLandscape(ctx, time);

  // 2. ZONA 1 (x = 0..760): Sungai Pegunungan & Intake Saringan Kasar
  drawRiverAndIntake(ctx, time);

  // 3. ZONA 2 (x = 840..1680): Instalasi Pengolahan Air (Koagulasi -> Sedimentasi -> Filtrasi)
  drawTreatmentPlant(ctx, time);

  // 4. ZONA 3 (x = 1760..2160): Bak Desinfeksi (Klorinasi) & Reservoir Air Bersih
  drawDisinfectionAndReservoir(ctx, time);

  // 5. ZONA 4 (x = 2240..2740): Pompa Distribusi & Menara Air (Water Tower)
  drawPumpAndWaterTower(ctx, time);

  // 6. ZONA 5 (x = 2780..3550): Meteran PDAM + Rumah Cross-Section + Jalur 2 Air Tanah (Akuifer, Sumur Bor, Pompa, Toren!)
  drawHomeAndKitchenTap(ctx, time);
  drawGroundwaterWellSystem(ctx, time);

  // 7. Jaringan Pipa Penghubung Bawah Tanah Beranimasi dari Sungai sampai Keran!
  drawAllConnectingPipes(ctx, time);

  ctx.restore();

  // 8. Overlay Hook awal (0.0 - 5.2s), Peringatan Akhir (48.0 - 55.4s), & CTA Follow (55.6 - 59.0s)
  if (time < 5.3) {
    drawWaterHook(ctx, time, width, height);
  }
  if (time >= 48.0 && time < 55.4) {
    const a = progress(time, 48.0, 48.5) * (1 - progress(time, 54.8, 55.4));
    ctx.save();
    ctx.globalAlpha = a;
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.23,
      "⚠ PDAM & Sumur → Tetap Masak / Filter Dulu!",
      "900 30px Arial, sans-serif",
      "rgba(220, 38, 38, 0.94)",
      "#FFFFFF",
      "#FDE047",
      68,
    );
    ctx.restore();
  }
  if (time >= 55.6) {
    const pop = progress(time, 55.8, 56.4, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawContinuousLandscape(ctx, time) {
  // Langit cerah biru-krem bersih
  const skyGrad = ctx.createLinearGradient(0, -250, 0, GROUND_Y);
  skyGrad.addColorStop(0, "#74B9E7");
  skyGrad.addColorStop(0.65, "#BCE0F7");
  skyGrad.addColorStop(1, "#EAF5FC");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-400, -300, 4400, GROUND_Y + 340);

  // Awan melayang pelan di sepanjang peta
  const drift = time * 14;
  for (let i = 0; i < 6; i++) {
    drawCloud(
      ctx,
      ((i * 680 + drift) % 4000) - 200,
      260 + (i % 2) * 85,
      1.0,
      "#FFFFFF",
      0.85,
    );
  }

  // Pegunungan di sisi kiri (hulu sungai, x = -200..900)
  ctx.fillStyle = "#4F8A6E";
  ctx.beginPath();
  ctx.moveTo(-300, GROUND_Y);
  ctx.lineTo(120, 480);
  ctx.lineTo(540, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3B6E58";
  ctx.beginPath();
  ctx.moveTo(180, GROUND_Y);
  ctx.lineTo(480, 560);
  ctx.lineTo(840, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Bukit landai memanjang ke kanan
  ctx.fillStyle = "#7BB686";
  ctx.beginPath();
  ctx.moveTo(-300, GROUND_Y);
  ctx.quadraticCurveTo(900, 740, 1900, 860);
  ctx.quadraticCurveTo(2900, 760, 4000, GROUND_Y);
  ctx.lineTo(4000, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Pohon-pohon
  drawPalmTree(ctx, 760, GROUND_Y - 52, 0.9, Math.sin(time * 1.4) * 0.5);
  drawPalmTree(ctx, 2190, GROUND_Y - 52, 0.95, Math.sin(time * 1.6 + 1) * 0.5);
  drawPalmTree(ctx, 2760, GROUND_Y - 52, 0.85, Math.sin(time * 1.5 + 2) * 0.5);

  // Hamparan rumput
  ctx.fillStyle = "#6BB34A";
  ctx.fillRect(-400, GROUND_Y - 64, 4400, 68);

  // Potongan Tanah (Cross-section)
  ctx.fillStyle = "#5D3722";
  ctx.fillRect(-400, GROUND_Y, 4400, 58);
  ctx.fillStyle = "#965234";
  ctx.fillRect(-400, GROUND_Y + 54, 4400, 1100);

  for (const p of PEBBLES) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * ZONA 1: Sungai Pegunungan & Intake Saringan Kasar (x = 40..720)
 */
function drawRiverAndIntake(ctx, time) {
  // Cekungan sungai dengan air keruh kecokelatan
  ctx.fillStyle = "#5C4028";
  drawRoundedRect(ctx, 20, GROUND_Y - 24, 560, 270, 48);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, 34, GROUND_Y - 14, 532, 246, 38);
  ctx.clip();

  const riverG = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 230);
  riverG.addColorStop(0, "#78927B");
  riverG.addColorStop(1, "#5D4C38");
  ctx.fillStyle = riverG;
  ctx.fillRect(34, GROUND_Y + 14, 532, 220);

  // Gelombang arus sungai + partikel lumpur & daun
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const wx = 60 + ((time * 75 + i * 135) % 480);
    ctx.beginPath();
    ctx.moveTo(wx, GROUND_Y + 34 + (i % 2) * 28);
    ctx.lineTo(wx + 55, GROUND_Y + 34 + (i % 2) * 28);
    ctx.stroke();
  }
  ctx.fillStyle = "#4A3321";
  for (let i = 0; i < 12; i++) {
    const px = 60 + ((time * 48 + i * 47) % 440);
    const py = GROUND_Y + 60 + (i % 4) * 38;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Rumah Pompa Intake + Saringan Kasar (Bar Screen) di tepi kanan sungai (x = 540..700)
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, 540, GROUND_Y - 120, 145, 310, 14);
  ctx.fill();
  // Kisi-kisi saringan kasar
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 5;
  for (let y = GROUND_Y + 35; y <= GROUND_Y + 150; y += 18) {
    ctx.beginPath();
    ctx.moveTo(548, y);
    ctx.lineTo(595, y);
    ctx.stroke();
  }
  // Roda pompa intake berputar
  ctx.save();
  ctx.translate(636, GROUND_Y + 92);
  ctx.rotate(time * 6);
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Label diegetik kecil di atas bangunan
  drawDiegeticSign(ctx, 300, GROUND_Y - 70, "SUNGAI / SUMBER AIR");
  drawDiegeticSign(ctx, 612, GROUND_Y - 148, "INTAKE & SARINGAN");
}

/**
 * ZONA 2: Instalasi Pengolahan Air / IPA — 3 Bak Berurutan (x = 850..1670)
 */
function drawTreatmentPlant(ctx, time) {
  // Bak 1: KOAGULASI (x = 860, air keruh diaduk tawas)
  drawTankBox(
    ctx,
    860,
    GROUND_Y - 30,
    235,
    290,
    "#7D6E52",
    "#5A4A36",
    time,
    (bx, by, bw, bh) => {
      // Pengaduk (mixer) berputar
      const mx = bx + bw / 2;
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(mx, by - 36);
      ctx.lineTo(mx, by + bh - 55);
      ctx.stroke();
      const bladeW = 48 * Math.cos(time * 7);
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(mx - bladeW, by + bh - 62);
      ctx.lineTo(mx + bladeW, by + bh - 62);
      ctx.stroke();
      // Partikel flok berputar
      ctx.fillStyle = "#4A3321";
      for (let i = 0; i < 9; i++) {
        const a = time * 3 + i * 0.7;
        ctx.beginPath();
        ctx.arc(
          mx + Math.cos(a) * 58,
          by + 130 + Math.sin(a * 1.4) * 55,
          6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    },
  );
  drawDiegeticSign(ctx, 978, GROUND_Y - 82, "1. KOAGULASI");

  // Bak 2: SEDIMENTASI (x = 1140, lumpur mengendap di dasar, atas mulai jernih)
  drawTankBox(
    ctx,
    1140,
    GROUND_Y - 30,
    235,
    290,
    "#62A8C9",
    "#4A6E7D",
    time,
    (bx, by, bw, bh) => {
      // Endapan lumpur di dasar bak
      ctx.fillStyle = "#4E3826";
      ctx.fillRect(bx + 12, by + bh - 54, bw - 24, 44);
      // Partikel perlahan turun mengendap
      ctx.fillStyle = "#5C4028";
      for (let i = 0; i < 8; i++) {
        const fall = (time * 0.35 + i * 0.21) % 1;
        const px = bx + 36 + ((i * 41) % (bw - 72));
        const py = lerp(by + 50, by + bh - 55, fall);
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  );
  drawDiegeticSign(ctx, 1258, GROUND_Y - 82, "2. SEDIMENTASI");

  // Bak 3: FILTRASI BERLAPIS (x = 1420, pasir silika + karbon aktif + kerikil -> air bening!)
  drawTankBox(
    ctx,
    1420,
    GROUND_Y - 30,
    235,
    290,
    "#38BDF8",
    "#0284C7",
    time,
    (bx, by, bw, bh) => {
      // 3 Lapisan media filter realistis
      ctx.fillStyle = "#EAB308"; // Pasir silika
      ctx.fillRect(bx + 12, by + 115, bw - 24, 42);
      ctx.fillStyle = "#1E293B"; // Karbon aktif
      ctx.fillRect(bx + 12, by + 157, bw - 24, 40);
      ctx.fillStyle = "#64748B"; // Kerikil
      ctx.fillRect(bx + 12, by + 197, bw - 24, 42);
      // Air bening berkilau di bawah
      ctx.fillStyle = "#7DD3FC";
      ctx.fillRect(bx + 12, by + 239, bw - 24, 40);
    },
  );
  drawDiegeticSign(ctx, 1538, GROUND_Y - 82, "3. FILTRASI");
}

/**
 * ZONA 3: Bak Desinfeksi (Klorinasi) & Reservoir (x = 1760..2160)
 */
function drawDisinfectionAndReservoir(ctx, time) {
  const killProg = progress(time, 24.5, 27.5, easeInOutCubic);

  drawTankBox(
    ctx,
    1785,
    GROUND_Y - 50,
    350,
    320,
    "#38BDF8",
    "#0EA5E9",
    time,
    (bx, by, bw, bh) => {
      // Tetesan klorin terukur dari atas
      ctx.fillStyle = "#E0F2FE";
      for (let i = 0; i < 4; i++) {
        const cyc = (time * 1.1 + i * 0.25) % 1;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + 20 + cyc * 90, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Kuman kecil lenyap saat terkena desinfeksi!
      const germScale = Math.max(0, 1 - killProg);
      if (germScale > 0.05) {
        drawBacteria(
          ctx,
          bx + 110,
          by + 150,
          "#4ADE80",
          18 * germScale,
          time,
          0.5,
        );
        drawBacteria(
          ctx,
          bx + 230,
          by + 185,
          "#A78BFA",
          16 * germScale,
          time,
          1.8,
        );
        drawBacteria(
          ctx,
          bx + 170,
          by + 225,
          "#FACC15",
          15 * germScale,
          time,
          3.1,
        );
      } else {
        // Kilau air steril bersih
        ctx.fillStyle = "#FFFFFF";
        for (let s = 0; s < 5; s++) {
          const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 4 + s * 1.3));
          ctx.globalAlpha = twinkle;
          ctx.beginPath();
          ctx.arc(bx + 65 + s * 56, by + 120 + (s % 2) * 75, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },
  );
  drawDiegeticSign(ctx, 1960, GROUND_Y - 102, "4. DESINFEKSI & RESERVOIR");
}

/**
 * ZONA 4: Pompa Distribusi & Menara Air (x = 2280..2700)
 */
function drawPumpAndWaterTower(ctx, time) {
  const tx = 2520;

  // Rumah Pompa Distribusi di sebelah kiri menara (x = 2320)
  ctx.fillStyle = "#334155";
  drawRoundedRect(ctx, 2265, GROUND_Y - 110, 130, 110, 12);
  ctx.fill();
  ctx.save();
  ctx.translate(2330, GROUND_Y - 55);
  ctx.rotate(time * 8);
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 7;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Kaki Menara Air (Water Tower) tinggi
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(tx - 80, GROUND_Y);
  ctx.lineTo(tx - 52, GROUND_Y - 290);
  ctx.moveTo(tx + 80, GROUND_Y);
  ctx.lineTo(tx + 52, GROUND_Y - 290);
  // Palang silang menara
  ctx.lineWidth = 7;
  ctx.moveTo(tx - 70, GROUND_Y - 100);
  ctx.lineTo(tx + 60, GROUND_Y - 210);
  ctx.moveTo(tx + 70, GROUND_Y - 100);
  ctx.lineTo(tx - 60, GROUND_Y - 210);
  ctx.stroke();

  // Tangki Menara Air dengan kaca level air biru
  ctx.fillStyle = "#CBD5E1";
  drawRoundedRect(ctx, tx - 110, GROUND_Y - 465, 220, 180, 32);
  ctx.fill();
  ctx.fillStyle = "#38BDF8";
  drawRoundedRect(ctx, tx - 92, GROUND_Y - 415, 184, 112, 18);
  ctx.fill();
  // Atap kerucut menara
  ctx.fillStyle = "#2563EB";
  ctx.beginPath();
  ctx.moveTo(tx - 122, GROUND_Y - 460);
  ctx.lineTo(tx, GROUND_Y - 525);
  ctx.lineTo(tx + 122, GROUND_Y - 460);
  ctx.closePath();
  ctx.fill();

  drawDiegeticSign(ctx, tx, GROUND_Y - 555, "GRAVITASI MENARA = TEKANAN DERAS");

  // Panah gravitasi ke bawah di menara air (menjelaskan kenapa air bisa naik ke lantai 2 tanpa pompa!)
  if (time >= 29.5 && time <= 37.5) {
    ctx.save();
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    const cyc = (time * 1.4) % 1;
    const ay = lerp(GROUND_Y - 260, GROUND_Y - 120, cyc);
    ctx.globalAlpha = Math.sin(cyc * Math.PI);
    ctx.beginPath();
    ctx.moveTo(tx + 125, ay - 35);
    ctx.lineTo(tx + 125, ay);
    ctx.lineTo(tx + 114, ay - 12);
    ctx.moveTo(tx + 125, ay);
    ctx.lineTo(tx + 136, ay - 12);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * ZONA 5: Meteran Air + Rumah Cross-Section + Keran Dapur & Gelas (x = 2820..3360)
 */
function drawHomeAndKitchenTap(ctx, time) {
  const hx = 2870;

  // Meteran Air di halaman depan rumah (x = 2805)
  ctx.fillStyle = "#1D4ED8";
  drawRoundedRect(ctx, 2775, GROUND_Y - 45, 68, 45, 8);
  ctx.fill();
  ctx.fillStyle = "#F8FAFC";
  ctx.beginPath();
  ctx.arc(2809, GROUND_Y - 22, 15, 0, Math.PI * 2);
  ctx.fill();
  // Jarum meteran berputar
  ctx.save();
  ctx.translate(2809, GROUND_Y - 22);
  ctx.rotate(time * 5);
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -11);
  ctx.stroke();
  ctx.restore();

  // Dinding Rumah Cross-Section
  ctx.fillStyle = "#F5EDE0";
  ctx.fillRect(hx, GROUND_Y - 340, 440, 340);
  // Backsplash keramik dapur biru muda
  ctx.fillStyle = "#E0F2FE";
  ctx.fillRect(hx + 75, GROUND_Y - 235, 300, 125);
  // Kabinet & Wastafel dapur
  ctx.fillStyle = "#B88754";
  ctx.fillRect(hx + 75, GROUND_Y - 115, 300, 115);
  ctx.fillStyle = "#94A3B8";
  drawRoundedRect(ctx, hx + 145, GROUND_Y - 122, 160, 20, 6);
  ctx.fill();

  // Keran Air Stainless di atas wastafel
  const tapX = hx + 225;
  const tapY = GROUND_Y - 195;
  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tapX + 42, GROUND_Y - 118);
  ctx.lineTo(tapX + 42, tapY);
  ctx.quadraticCurveTo(tapX + 42, tapY - 32, tapX, tapY - 32);
  ctx.lineTo(tapX, tapY - 10);
  ctx.stroke();

  // Aliran air jernih mengucur dari keran ke gelas!
  ctx.strokeStyle = "rgba(56, 189, 248, 0.88)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(tapX, tapY - 6);
  ctx.lineTo(tapX, GROUND_Y - 126);
  ctx.stroke();

  // Gelas kaca terisi air jernih
  ctx.fillStyle = "rgba(56, 189, 248, 0.72)";
  const fillCycle = (time * 0.25) % 1;
  const waterH = 18 + fillCycle * 34;
  ctx.fillRect(tapX - 20, GROUND_Y - 122 - waterH, 40, waterH);
  ctx.strokeStyle = "#64748B";
  ctx.lineWidth = 4;
  ctx.strokeRect(tapX - 22, GROUND_Y - 178, 44, 56);

  // Atap rumah genteng terakota
  ctx.fillStyle = "#C95432";
  ctx.beginPath();
  ctx.moveTo(hx - 35, GROUND_Y - 336);
  ctx.lineTo(hx + 65, GROUND_Y - 465);
  ctx.lineTo(hx + 375, GROUND_Y - 465);
  ctx.lineTo(hx + 475, GROUND_Y - 336);
  ctx.closePath();
  ctx.fill();
}

/**
 * ZONA 6 (JALUR 2 — AIR TANAH / SUMUR BOR):
 * Terletak tepat di bawah & sisi kanan rumah (x = 3050 .. 3650, y = 520 .. 1680):
 *  - Lapisan pasir & kerikil penyaring alami air hujan
 *  - Kantung Akuifer (Air Tanah biru di kedalaman)
 *  - Pipa Sumur Bor vertikal -> Pompa Jet Pump -> Naik ke Toren/Tandon Air di atas rumah -> turun ke keran!
 *  - Septic tank di samping sebagai pengingat jarak aman minimal 10 meter!
 */
function drawGroundwaterWellSystem(ctx, time) {
  const wellX = 3420;
  const aquiferY = GROUND_Y + 340;

  // 1. Lapisan Pasir & Batu Filter Alami di atas Akuifer
  ctx.fillStyle = "#B88954";
  ctx.fillRect(2840, GROUND_Y + 210, 920, 72);
  ctx.fillStyle = "#64748B";
  ctx.fillRect(2840, GROUND_Y + 282, 920, 62);

  // Tetesan air hujan meresap ke dalam tanah menuju akuifer
  ctx.fillStyle = "rgba(125, 211, 252, 0.85)";
  for (let i = 0; i < 10; i++) {
    const cyc = (time * 0.45 + i * 0.19) % 1;
    const rx = 2940 + i * 78;
    const ry = lerp(GROUND_Y + 20, aquiferY + 20, cyc);
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Kantung Akuifer (Air Tanah Biru Cerah di Kedalaman)
  const aqGrad = ctx.createLinearGradient(0, aquiferY, 0, aquiferY + 210);
  aqGrad.addColorStop(0, "#0284C7");
  aqGrad.addColorStop(1, "#0C4A6E");
  ctx.fillStyle = aqGrad;
  drawRoundedRect(ctx, 2860, aquiferY, 860, 195, 42);
  ctx.fill();

  // Gelombang arus lembut di dalam akuifer
  ctx.strokeStyle = "rgba(186, 230, 253, 0.45)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const wx = 2910 + ((time * 55 + i * 195) % 720);
    ctx.beginPath();
    ctx.moveTo(wx, aquiferY + 55 + (i % 2) * 55);
    ctx.lineTo(wx + 65, aquiferY + 55 + (i % 2) * 55);
    ctx.stroke();
  }
  if (time >= 28.5 && time <= 42.5) {
    drawDiegeticSign(ctx, 3140, aquiferY + 62, "AKUIFER (AIR TANAH ALAMI)");
  }

  // 3. Septic Tank di sisi kanan pipa rumah (bersih tidak bertabrakan dengan pipa PDAM maupun pipa sumur)
  ctx.fillStyle = "#475569";
  drawRoundedRect(ctx, 3195, GROUND_Y + 68, 125, 110, 12);
  ctx.fill();
  ctx.fillStyle = "#785A3A";
  ctx.fillRect(3205, GROUND_Y + 112, 105, 56);
  ctx.fillStyle = "#FDE047";
  ctx.font = "bold 17px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Septic Tank", 3258, GROUND_Y + 95);
  if (time >= 32.5 && time <= 37.5) {
    drawDiegeticSign(ctx, 3258, GROUND_Y + 205, "⚠ Jarak sumur wajib > 10m!");
  }

  // 4. Pompa Air Rumah (Jet Pump) di samping kanan rumah
  ctx.fillStyle = "#15803D";
  drawRoundedRect(ctx, wellX - 38, GROUND_Y - 58, 76, 58, 10);
  ctx.fill();
  ctx.save();
  ctx.translate(wellX, GROUND_Y - 29);
  ctx.rotate(time * 9);
  ctx.strokeStyle = "#86EFAC";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
  }
  ctx.restore();
  drawDiegeticSign(ctx, wellX + 18, GROUND_Y - 84, "POMPA SUMUR");

  // 5. Toren / Tandon Air Oranye di atas atap samping rumah!
  const torenX = wellX;
  const torenY = GROUND_Y - 430;
  // Menara dudukan besi toren
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(torenX - 36, GROUND_Y - 58);
  ctx.lineTo(torenX - 30, torenY + 65);
  ctx.moveTo(torenX + 36, GROUND_Y - 58);
  ctx.lineTo(torenX + 30, torenY + 65);
  ctx.stroke();
  // Tangki Toren Oranye khas rumah Indonesia
  ctx.fillStyle = "#EA580C";
  drawRoundedRect(ctx, torenX - 52, torenY - 65, 104, 130, 26);
  ctx.fill();
  ctx.fillStyle = "#38BDF8";
  drawRoundedRect(ctx, torenX - 38, torenY - 25, 76, 76, 12);
  ctx.fill();
  drawDiegeticSign(ctx, torenX, torenY - 94, "TOREN AIR RUMAH");

  // 6. Pipa Sumur Bor (dari Akuifer -> Pompa -> Naik ke Toren -> Turun ke Keran Dapur!)
  drawAnimatedPipe(
    ctx,
    [
      { x: wellX, y: aquiferY + 90 },
      { x: wellX, y: GROUND_Y - 29 },
      { x: wellX, y: torenY - 20 },
    ],
    1,
    {
      outerColor: "#1E293B",
      innerColor: "#334155",
      outerWidth: 20,
      innerWidth: 11,
      flowDots: true,
      time,
      dotColor: "#7DD3FC",
    },
  );

  // Pipa turun dari Toren ke Dapur Rumah
  drawAnimatedPipe(
    ctx,
    [
      { x: torenX - 42, y: torenY + 45 },
      { x: 3137, y: torenY + 45 },
      { x: 3137, y: GROUND_Y - 122 },
    ],
    1,
    {
      outerColor: "#1E293B",
      innerColor: "#334155",
      outerWidth: 18,
      innerWidth: 10,
      flowDots: true,
      time,
      dotColor: "#38BDF8",
    },
  );
}

/**
 * Semua Pipa Penghubung Bawah Tanah dengan Titik Aliran Air Hidup!
 */
function drawAllConnectingPipes(ctx, time) {
  const opts = {
    outerColor: "#334155",
    innerColor: "#475569",
    outerWidth: 24,
    innerWidth: 14,
    flowDots: true,
    time,
    dotColor: "#38BDF8",
  };

  // Intake -> Bak 1 Koagulasi (air masih agak keruh)
  drawAnimatedPipe(
    ctx,
    [
      { x: 675, y: GROUND_Y + 92 },
      { x: 860, y: GROUND_Y + 92 },
    ],
    1,
    {
      ...opts,
      dotColor: "#A8A29E",
    },
  );
  // Bak 1 -> Bak 2 -> Bak 3 -> Desinfeksi
  drawAnimatedPipe(
    ctx,
    [
      { x: 1095, y: GROUND_Y + 60 },
      { x: 1140, y: GROUND_Y + 60 },
    ],
    1,
    opts,
  );
  drawAnimatedPipe(
    ctx,
    [
      { x: 1375, y: GROUND_Y + 60 },
      { x: 1420, y: GROUND_Y + 60 },
    ],
    1,
    opts,
  );
  drawAnimatedPipe(
    ctx,
    [
      { x: 1655, y: GROUND_Y + 235 },
      { x: 1785, y: GROUND_Y + 235 },
    ],
    1,
    opts,
  );
  // Desinfeksi -> Pompa -> Menara Air -> Pipa Distribusi Bawah Tanah -> Meteran -> Keran Rumah!
  drawAnimatedPipe(
    ctx,
    [
      { x: 2135, y: GROUND_Y + 190 },
      { x: 2330, y: GROUND_Y + 190 },
      { x: 2330, y: GROUND_Y - 55 },
      { x: 2520, y: GROUND_Y - 55 },
      { x: 2520, y: GROUND_Y - 300 },
    ],
    1,
    opts,
  );
  drawAnimatedPipe(
    ctx,
    [
      { x: 2560, y: GROUND_Y - 300 },
      { x: 2560, y: GROUND_Y + 150 },
      { x: 2809, y: GROUND_Y + 150 },
      { x: 2809, y: GROUND_Y - 22 },
      { x: 2809, y: GROUND_Y + 95 },
      { x: 3137, y: GROUND_Y + 95 },
      { x: 3137, y: GROUND_Y - 122 },
    ],
    1,
    opts,
  );
}

function drawTankBox(
  ctx,
  x,
  y,
  w,
  h,
  waterTopCol,
  waterBotCol,
  time,
  drawInside,
) {
  ctx.fillStyle = "#64748B";
  drawRoundedRect(ctx, x, y, w, h, 18);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, x + 12, y + 12, w - 24, h - 24, 12);
  ctx.clip();

  ctx.fillStyle = "#0F172A";
  ctx.fillRect(x + 12, y + 12, w - 24, h - 24);

  const g = ctx.createLinearGradient(0, y + 42, 0, y + h);
  g.addColorStop(0, waterTopCol);
  g.addColorStop(1, waterBotCol);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + h);
  for (let px = x + 12; px <= x + w - 12; px += 14) {
    ctx.lineTo(px, y + 48 + Math.sin(px * 0.05 + time * 4) * 4);
  }
  ctx.lineTo(x + w - 12, y + h);
  ctx.closePath();
  ctx.fill();

  drawInside(x, y, w, h);
  ctx.restore();
}

function drawDiegeticSign(ctx, cx, cy, text) {
  drawAutoPill(
    ctx,
    cx,
    cy,
    text,
    "900 20px Arial, sans-serif",
    "rgba(15, 23, 42, 0.8)",
    "#F8FAFC",
    null,
    40,
  );
}

function drawWaterHook(ctx, time, width, height) {
  const enter = progress(time, 0.0, 0.35, easeOutBack);
  const exit = 1 - progress(time, 3.8, 4.4, easeInOutCubic);
  if (exit <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = exit;
  const shakeX = time < 0.4 ? Math.sin(time * 65) * 7 * (1 - time / 0.4) : 0;
  ctx.translate(width / 2 + shakeX, height * 0.21);
  ctx.scale(clamp(enter, 0.01, 1.05), clamp(enter, 0.01, 1.05));

  drawAutoPill(
    ctx,
    0,
    -90,
    "🤯 FAKTA MENGEJUTKAN!",
    "900 36px Arial, sans-serif",
    "#DC2626",
    "#FDE047",
    "#FDE047",
    72,
  );

  ctx.lineJoin = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.font = "900 49px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("AIR PDAM VS AIR TANAH", 0, 8);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("AIR PDAM VS AIR TANAH", 0, 8);

  ctx.strokeText("MANA LEBIH AMAN?", 0, 72);
  ctx.fillStyle = "#FFD43B";
  ctx.fillText("MANA LEBIH AMAN?", 0, 72);

  const subA = progress(time, 0.45, 0.85);
  ctx.globalAlpha = exit * subA;
  drawAutoPill(
    ctx,
    0,
    138,
    "Begini perjalanan keduanya sampai ke keranmu!",
    "bold 25px Arial, sans-serif",
    "rgba(15, 23, 42, 0.85)",
    "#E2E8F0",
    null,
    50,
  );
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
