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
import { drawRoundedRect } from "../engine/shapes.js";

/**
 * Film Animasi 1-Shot 3D Stylized Cutaway Diorama (68 Detik):
 * "Kenapa Cat Tembok Rumah Menggelembung & Mengelupas?"
 *
 * Gaya Visual: 3D Clay-Toy / Blender Stylized Cutaway (pencahayaan siang cerah,
 * soft shadow, pohon kelapa & rumput lembut, karakter 3D minimalis helm kuning).
 *
 * Alur 4 Babak (Persis Referensi):
 *  - Babak 1 (0.0 - 14.0s) : Kondisi Awal — Karakter mengecat tembok ruang tamu ("Awalnya aman.")
 *  - Babak 2 (14.0 - 34.0s): Macro Zoom Penyebab — Pori-pori bata & air tanah naik lewat kapilaritas + garam alkali ("tapi dia sabar.")
 *  - Babak 3 (34.0 - 45.0s): Dampak Nyata — Cat menggelembung, retak, dan mengelupas jatuh ke lantai!
 *  - Babak 4 (45.0 - 68.0s): Solusi Detail — Kerok cat lama -> Waterproofing & Alkali Sealer memblokir air -> Cat ulang -> Awet + "+ FOLLOW"
 */

const FLOOR_Y = 1220;
const WALL_X = 430;
const WALL_W = 190; // Penampang melintang tembok (x = 430 .. 620)
const WALL_TOP = 540;

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 940, zoom: 1.0 }, // Babak 1: Wide Cutaway Diorama
  { time: 13.4, x: 540, y: 940, zoom: 1.0 },
  { time: 15.2, x: 535, y: 980, zoom: 2.35, ease: easeInOutCubic }, // Babak 2: Macro Zoom ke pori-pori bata & kapilaritas air tanah
  { time: 33.4, x: 535, y: 950, zoom: 2.35 },
  { time: 35.0, x: 635, y: 930, zoom: 1.38, ease: easeInOutCubic }, // Babak 3: Dampak — Cat menggelembung & mengelupas
  { time: 44.6, x: 635, y: 930, zoom: 1.38 },
  { time: 46.2, x: 610, y: 955, zoom: 1.52, ease: easeInOutCubic }, // Babak 4A: Karakter kerok & oles Waterproofing + Sealer
  { time: 54.0, x: 560, y: 970, zoom: 2.1, ease: easeInOutCubic }, // Babak 4B: Macro bukti lapisan waterproofing memblokir air!
  { time: 59.5, x: 560, y: 970, zoom: 2.1 },
  { time: 61.2, x: 540, y: 940, zoom: 1.0, ease: easeInOutCubic }, // Babak 4C: Wide Cutaway — Tembok kering & awet + CTA
  { time: 68.0, x: 540, y: 940, zoom: 1.0 },
];

// Posisi pori-pori deterministik di dalam penampang bata/plester (tidak berkedip acak)
const WALL_PORES = [
  { x: 455, y: 1175, r: 7 },
  { x: 495, y: 1145, r: 9 },
  { x: 540, y: 1165, r: 6 },
  { x: 580, y: 1130, r: 8 },
  { x: 470, y: 1090, r: 10 },
  { x: 525, y: 1070, r: 7 },
  { x: 575, y: 1055, r: 9 },
  { x: 458, y: 1015, r: 8 },
  { x: 510, y: 995, r: 11 },
  { x: 568, y: 985, r: 7 },
  { x: 482, y: 945, r: 9 },
  { x: 545, y: 930, r: 8 },
  { x: 590, y: 915, r: 6 },
  { x: 465, y: 880, r: 7 },
  { x: 525, y: 865, r: 10 },
  { x: 575, y: 850, r: 7 },
  { x: 490, y: 810, r: 8 },
  { x: 555, y: 795, r: 6 },
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
  h = 56,
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

export function drawWallPeelingScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. Latar 3D Stylized Daylight (Langit cerah, padang rumput lembut, semak & pohon kelapa)
  drawStylizedBackdrop(ctx, time);

  // 2. Potongan Melintang Tanah Basah (kiri bawah) & Pondasi Rumah + Ruang Tamu (kanan)
  drawGroundAndRoomCutaway(ctx, time);

  // 3. Penampang Tembok Bata Berpori + Efek Kapilaritas Air Tanah + Cat Menggelembung + Solusi Waterproofing!
  drawWallCrossSection(ctx, time);

  // 4. Karakter 3D Minimalis Imut (Helm proyek kuning, baju hitam, celana jeans, sepatu putih)
  drawClayWorker3D(ctx, time);

  ctx.restore();

  // 5. Overlay Minimalis (CTA Follow di akhir)
  if (time >= 64.0) {
    const pop = progress(time, 64.2, 64.8, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

/**
 * Latar siang hari cerah ala Blender 3D stylized (persis referensi: langit biru, rumput hijau berlapis, pohon kelapa).
 */
function drawStylizedBackdrop(ctx, time) {
  // Langit biru lembut
  const skyG = ctx.createLinearGradient(0, -150, 0, 900);
  skyG.addColorStop(0, "#5CA9F2");
  skyG.addColorStop(0.6, "#9BD5FF");
  skyG.addColorStop(1, "#DDF2FF");
  ctx.fillStyle = skyG;
  ctx.fillRect(-300, -200, 1700, 1200);

  // Bukit & padang rumput lembut berlapis (kesan depth-of-field)
  ctx.fillStyle = "#B7E7B0";
  ctx.fillRect(-300, 560, 1700, 160);
  ctx.fillStyle = "#88D47C";
  ctx.fillRect(-300, 680, 1700, 260);
  ctx.fillStyle = "#69BC5E";
  ctx.fillRect(-300, 880, 1700, 420);

  // Semak-semak bulat 3D lembut di kejauhan
  const bushes = [
    [110, 690, 42],
    [165, 695, 34],
    [320, 685, 38],
    [820, 685, 44],
    [875, 692, 32],
    [980, 688, 40],
  ];
  for (const [bx, by, br] of bushes) {
    const bg = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 4, bx, by, br);
    bg.addColorStop(0, "#74C967");
    bg.addColorStop(1, "#3E8E36");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pohon kelapa bergoyang pelan di belakang rumah (ikonik seperti video referensi!)
  const sway = Math.sin(time * 1.1) * 8;
  ctx.save();
  ctx.strokeStyle = "#9C6E44";
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(235, 760);
  ctx.quadraticCurveTo(255, 580, 290 + sway * 0.4, 430);
  ctx.stroke();

  const topX = 290 + sway * 0.4;
  const topY = 430;
  const leafAngles = [-2.6, -2.0, -1.3, -0.5, 0.25, 0.85];
  for (const ang of leafAngles) {
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(ang + sway * 0.008);
    const lg = ctx.createLinearGradient(0, 0, 150, 0);
    lg.addColorStop(0, "#2E8B3B");
    lg.addColorStop(1, "#6AD16E");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(75, -36, 155, 16);
    ctx.quadraticCurveTo(75, -6, 0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Potongan melintang tanah luar rumah (kiri) + interior ruang tamu (kanan) dengan shading 3D lembut.
 */
function drawGroundAndRoomCutaway(ctx, time) {
  // Hujan rintik di luar rumah (sisi kiri x = 40..410) saat Babak 2 & Babak 4C (uji ketahanan!)
  const isRaining = (time >= 14.0 && time <= 34.0) || time >= 60.5;
  if (isRaining) {
    ctx.strokeStyle = "rgba(56, 189, 248, 0.72)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 16; i++) {
      const cyc = (time * 1.45 + i * 0.17) % 1;
      const rx = 50 + (i % 8) * 48;
      const ry = lerp(380, FLOOR_Y - 10, cyc);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 26);
      ctx.stroke();
    }
  }

  // Penampang Tanah di Bawah Rumah (x = -120 .. 1200, y = FLOOR_Y .. 1900)
  const soilG = ctx.createLinearGradient(0, FLOOR_Y, 0, 1750);
  soilG.addColorStop(0, "#7A5230");
  soilG.addColorStop(0.45, "#593A1E");
  soilG.addColorStop(1, "#2A3E52"); // lapisan air tanah basah di bawah!
  ctx.fillStyle = soilG;
  ctx.fillRect(-120, FLOOR_Y, 1320, 750);

  // Lapisan rumput tipis di luar rumah (kiri tembok: x = -120 .. WALL_X)
  ctx.fillStyle = "#52B748";
  ctx.fillRect(-120, FLOOR_Y - 18, WALL_X + 120, 22);

  // Muka Air Tanah biru mengilap di bawah pondasi (y = 1280 .. 1520)
  const waterGlow = ctx.createLinearGradient(0, FLOOR_Y + 45, 0, FLOOR_Y + 230);
  waterGlow.addColorStop(0, "rgba(56, 189, 248, 0.0)");
  waterGlow.addColorStop(0.35, "rgba(56, 189, 248, 0.42)");
  waterGlow.addColorStop(1, "rgba(14, 116, 144, 0.78)");
  ctx.fillStyle = waterGlow;
  ctx.fillRect(-120, FLOOR_Y + 45, 1320, 240);

  // Label kecil "AIR TANAH" di tanah basah
  ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("💧 AIR TANAH LEMBAP", 240, FLOOR_Y + 135);

  // --- RUANG TAMU POTONGAN MELINTANG (Sisi Kanan: x = WALL_X + WALL_W .. 1150) ---
  const roomX = WALL_X + WALL_W;
  const roomW = 520;

  // Dinding belakang ruang tamu (krem hangat 3D soft lighting)
  const roomWallG = ctx.createLinearGradient(roomX, WALL_TOP, roomX + roomW, FLOOR_Y);
  roomWallG.addColorStop(0, "#F3EADB");
  roomWallG.addColorStop(1, "#DED2BE");
  ctx.fillStyle = roomWallG;
  ctx.fillRect(roomX, WALL_TOP, roomW, FLOOR_Y - WALL_TOP);

  // Plafon & Atap Dak Beton 3D di atas ruang tamu
  ctx.fillStyle = "#94A3B8";
  ctx.fillRect(WALL_X - 30, WALL_TOP - 46, WALL_W + roomW + 60, 46);
  ctx.fillStyle = "#64748B";
  ctx.fillRect(WALL_X - 30, WALL_TOP - 8, WALL_W + roomW + 60, 12);

  // Jendela kamar di dinding belakang
  ctx.fillStyle = "#BAE6FD";
  drawRoundedRect(ctx, roomX + 210, WALL_TOP + 135, 190, 175, 10);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 10;
  ctx.stroke();
  // Tirai oranye hangat (mirip ruang makan di referensi!)
  ctx.fillStyle = "#C2410C";
  ctx.fillRect(roomX + 195, WALL_TOP + 125, 38, 200);
  ctx.fillRect(roomX + 375, WALL_TOP + 125, 38, 200);

  // Lantai kayu 3D ruang tamu + bayangan lembut
  const floorG = ctx.createLinearGradient(0, FLOOR_Y - 18, 0, FLOOR_Y + 26);
  floorG.addColorStop(0, "#A67C52");
  floorG.addColorStop(1, "#785334");
  ctx.fillStyle = floorG;
  ctx.fillRect(roomX, FLOOR_Y - 18, roomW, 38);

  // Karpet merah bulat + meja kecil di sisi kanan ruangan
  ctx.fillStyle = "#991B1B";
  ctx.beginPath();
  ctx.ellipse(roomX + 310, FLOOR_Y - 4, 130, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Meja kecil 3D di pojok kanan
  ctx.fillStyle = "#854D0E";
  drawRoundedRect(ctx, roomX + 340, FLOOR_Y - 108, 120, 16, 4);
  ctx.fill();
  ctx.fillRect(roomX + 354, FLOOR_Y - 92, 12, 76);
  ctx.fillRect(roomX + 434, FLOOR_Y - 92, 12, 76);
}

/**
 * Penampang Melintang Tembok Bata Berpori (Jantung Visual Video!)
 * - Babak 1: Tembok mulus baru dicat
 * - Babak 2: Pori-pori bata + air tanah naik lewat kapilaritas + garam alkali
 * - Babak 3: Lapisan cat menggelembung & mengelupas jatuh!
 * - Babak 4: Lapisan Waterproofing + Alkali Sealer memblokir air -> tembok kering & mulus!
 */
function drawWallCrossSection(ctx, time) {
  const rightFaceX = WALL_X + WALL_W; // x = 620 (sisi cat interior)

  // Kemajuan tiap fase
  const capillaryRise = progress(time, 16.0, 32.5, easeInOutCubic); // air tanah naik
  const bubbleProg =
    progress(time, 33.5, 42.0, easeOutCubic) *
    (1 - progress(time, 46.0, 48.2, easeInOutCubic)); // menggelembung & mengelupas lalu dikerok!
  const waterproofProg = progress(time, 49.0, 53.5, easeInOutCubic); // lapisan waterproofing + sealer
  const repaintProg = progress(time, 59.8, 62.5, easeOutCubic); // cat ulang mulus

  // 1. Dasar Plester Abu-abu Beton/Semen di Penampang Tembok
  const wallG = ctx.createLinearGradient(WALL_X, 0, rightFaceX, 0);
  wallG.addColorStop(0, "#94A3B8");
  wallG.addColorStop(0.5, "#CBD5E1");
  wallG.addColorStop(1, "#94A3B8");
  ctx.fillStyle = wallG;
  ctx.fillRect(WALL_X, WALL_TOP, WALL_W, FLOOR_Y - WALL_TOP + 35);

  // 2. Susunan Batu Bata Merah di tengah penampang tembok
  for (let row = 0; row < 12; row++) {
    const by = WALL_TOP + 22 + row * 56;
    ctx.fillStyle = "#B45338";
    drawRoundedRect(ctx, WALL_X + 26, by, WALL_W - 52, 42, 5);
    ctx.fill();
    // Highlight 3D tipis pada tiap bata
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.fillRect(WALL_X + 30, by + 3, WALL_W - 60, 7);
  }

  // 3. Pori-pori mikro gelap di dalam bata & plester (ikonik seperti "Tapi beton itu berpori")
  const poreAlpha = 0.45 + 0.55 * progress(time, 14.5, 16.5);
  for (const p of WALL_PORES) {
    ctx.fillStyle = `rgba(30, 41, 59, ${poreAlpha * 0.65})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Efek Kapilaritas Air Tanah Merambat NAIK lewat pori-pori!
  if (time >= 16.0) {
    // Jika waterproofing sudah terpasang (waterproofProg > 0.5), air tertahan di bagian kiri & tidak bisa menembus sisi kanan!
    const maxWaterX = lerp(rightFaceX - 4, WALL_X + WALL_W - 44, waterproofProg);
    const waterTopY = lerp(FLOOR_Y + 20, 790, capillaryRise);

    // Zona lembap biru transparan merambat ke atas
    const dampG = ctx.createLinearGradient(0, FLOOR_Y + 20, 0, waterTopY);
    dampG.addColorStop(0, "rgba(14, 165, 233, 0.52)");
    dampG.addColorStop(1, "rgba(56, 189, 248, 0.18)");
    ctx.fillStyle = dampG;
    ctx.fillRect(WALL_X + 6, waterTopY, maxWaterX - (WALL_X + 6), FLOOR_Y + 25 - waterTopY);

    // Tetesan air 3D mengilap (glossy blue spheres) merambat naik di pori-pori!
    for (let i = 0; i < WALL_PORES.length; i++) {
      const p = WALL_PORES[i];
      if (p.y >= waterTopY && p.x < maxWaterX - 4) {
        const pulse = 0.85 + 0.25 * Math.sin(time * 4 + i);
        const r = (p.r + 2) * pulse;
        const dg = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 1, p.x, p.y, r);
        dg.addColorStop(0, "#E0F2FE");
        dg.addColorStop(0.5, "#38BDF8");
        dg.addColorStop(1, "#0284C7");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Kristal garam alkali putih mendorong dari belakang cat saat Babak 2 akhir & Babak 3!
    if (time >= 26.0 && waterproofProg < 0.4) {
      const saltA = progress(time, 26.0, 29.0) * (1 - waterproofProg * 2.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(saltA, 0, 0.9)})`;
      for (let s = 0; s < 10; s++) {
        const sy = 840 + s * 34;
        ctx.beginPath();
        ctx.arc(rightFaceX - 10 + Math.sin(s * 2) * 3, sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 5. SOLUSI (Babak 4): Lapisan Waterproofing + Alkali Sealer kedap air di sisi dalam tembok!
  if (waterproofProg > 0.02) {
    const shieldH = (FLOOR_Y - WALL_TOP - 20) * waterproofProg;
    const shieldTop = FLOOR_Y - shieldH;

    // Lapisan Waterproofing biru-toska solid (memblokir kapilaritas!)
    ctx.fillStyle = "#0D9488";
    ctx.fillRect(rightFaceX - 20, shieldTop, 14, shieldH);
    // Lapisan Primer Alkali Sealer kuning-putih tipis di atas waterproofing
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(rightFaceX - 6, shieldTop, 8, shieldH);

    // Efek pantulan air tertahan di perisai waterproofing (53.5s - 60s)
    if (time >= 53.5 && time <= 60.5) {
      for (let k = 0; k < 5; k++) {
        const bounce = Math.abs(Math.sin(time * 5 + k));
        const bx = rightFaceX - 28 - bounce * 18;
        const by = 880 + k * 65;
        ctx.fillStyle = "#38BDF8";
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 6. Lapisan Cat Tembok Interior di Sisi Kanan (x = 620)
  // Sebelum dikerok (t < 46s) atau setelah dicat ulang (repaintProg > 0)
  const paintVisible = time < 46.5 || repaintProg > 0.02;
  if (paintVisible) {
    ctx.save();
    ctx.strokeStyle = "#FFFBEB";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";

    if (bubbleProg > 0.02 && time < 47.0) {
      // Cat menggelembung & terkelupas keluar ke kanan!
      ctx.beginPath();
      ctx.moveTo(rightFaceX + 4, WALL_TOP + 10);
      for (let y = WALL_TOP + 10; y <= FLOOR_Y - 12; y += 16) {
        let bulge = 0;
        if (y > 830 && y < 1160) {
          const wave = Math.sin((y - 830) * 0.045);
          bulge = Math.max(0, wave) * 34 * bubbleProg;
        }
        ctx.lineTo(rightFaceX + 4 + bulge, y);
      }
      ctx.stroke();

      // Serpihan cat mengelupas jatuh ke lantai ruang tamu!
      if (bubbleProg > 0.45) {
        ctx.fillStyle = "#FEF3C7";
        for (let f = 0; f < 6; f++) {
          const cyc = (time * 0.55 + f * 0.19) % 1;
          const fx = rightFaceX + 26 + f * 12 + Math.sin(cyc * 5 + f) * 14;
          const fy = lerp(920 + f * 25, FLOOR_Y - 22, cyc * cyc);
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(cyc * 4 + f);
          drawRoundedRect(ctx, -10, -4, 20, 8, 2);
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      // Cat tembok mulus sempurna (Babak 1 & setelah dicat ulang di Babak 4!)
      const hPaint = time < 46.5 ? FLOOR_Y - WALL_TOP - 20 : (FLOOR_Y - WALL_TOP - 20) * repaintProg;
      ctx.beginPath();
      ctx.moveTo(rightFaceX + 5, FLOOR_Y - 14);
      ctx.lineTo(rightFaceX + 5, FLOOR_Y - 14 - hPaint);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Label penampang saat Macro Zoom
  if (time >= 15.5 && time <= 23.0) {
    drawAutoPill(
      ctx,
      WALL_X + WALL_W / 2,
      830,
      "PORI-PORI BATA",
      "900 18px Arial, sans-serif",
      "rgba(15, 23, 42, 0.88)",
      "#FDE047",
      "#94A3B8",
      38,
    );
  }
  if (time >= 53.5 && time <= 60.0) {
    drawAutoPill(
      ctx,
      rightFaceX - 10,
      825,
      "🛡️ WATERPROOFING + SEALER",
      "900 17px Arial, sans-serif",
      "rgba(13, 148, 136, 0.94)",
      "#FFFFFF",
      "#99F6E4",
      38,
    );
  }
}

/**
 * Karakter 3D Minimalis Clay-Toy (Helm proyek kuning, baju hitam, celana jeans, sepatu putih)
 * — persis karakter imut di video referensi!
 */
function drawClayWorker3D(ctx, time) {
  // Posisi & mood karakter mengikuti 4 babak
  let wx = 740;
  let mood = "smile"; // 'smile' | 'shock' | 'work' | 'happy'
  let tool = "roller"; // 'roller' | 'none' | 'scraper' | 'waterproof'

  if (time < 9.0) {
    wx = 720;
    mood = "work";
    tool = "roller";
  } else if (time < 34.0) {
    wx = lerp(720, 790, progress(time, 9.0, 11.0, easeInOutCubic));
    mood = "smile";
    tool = "none";
  } else if (time < 45.0) {
    wx = 765;
    mood = "shock";
    tool = "none";
  } else if (time < 49.0) {
    wx = 715;
    mood = "work";
    tool = "scraper";
  } else if (time < 59.5) {
    wx = 715;
    mood = "work";
    tool = "waterproof";
  } else if (time < 62.8) {
    wx = 720;
    mood = "work";
    tool = "roller";
  } else {
    wx = lerp(720, 785, progress(time, 62.8, 64.0, easeInOutCubic));
    mood = "happy";
    tool = "none";
  }

  const baseY = FLOOR_Y - 18;
  const bob = Math.sin(time * (mood === "work" ? 7 : 2.6)) * 3;

  ctx.save();
  ctx.translate(wx, baseY);

  // Soft 3D Contact Shadow di lantai kayu
  ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 54, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sepatu putih 3D
  ctx.fillStyle = "#F8FAFC";
  drawRoundedRect(ctx, -34, -18, 28, 18, 8);
  ctx.fill();
  drawRoundedRect(ctx, 6, -18, 28, 18, 8);
  ctx.fill();

  // Celana jeans biru tua 3D
  ctx.fillStyle = "#1E3A5F";
  drawRoundedRect(ctx, -30, -96, 24, 82, 10);
  ctx.fill();
  drawRoundedRect(ctx, 6, -96, 24, 82, 10);
  ctx.fill();

  // Sweater hitam 3D dengan highlight lembut
  const bodyG = ctx.createLinearGradient(-44, -200, 44, -90);
  bodyG.addColorStop(0, "#334155");
  bodyG.addColorStop(0.4, "#1E293B");
  bodyG.addColorStop(1, "#0F172A");
  ctx.fillStyle = bodyG;
  drawRoundedRect(ctx, -44, -198 + bob, 88, 112, 26);
  ctx.fill();

  // Kepala bulat 3D smooth-shaded (gaya clay-toy!)
  const headY = -242 + bob;
  const headG = ctx.createRadialGradient(-14, headY - 12, 8, 0, headY, 48);
  headG.addColorStop(0, "#FDE0C2");
  headG.addColorStop(0.75, "#E8B98E");
  headG.addColorStop(1, "#C9966B");
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, headY, 44, 0, Math.PI * 2);
  ctx.fill();

  // Wajah minimalis imut (mata titik hitam + senyum/kaget kecil)
  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(-14, headY + 2, 4.2, 0, Math.PI * 2);
  ctx.arc(10, headY + 2, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (mood === "shock") {
    ctx.fillStyle = "#0F172A";
    ctx.arc(-2, headY + 18, 6.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(-2, headY + 12, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  // Helm Proyek Kuning 3D mengilap (ikonik persis referensi!)
  const helmG = ctx.createRadialGradient(-14, headY - 38, 6, 0, headY - 22, 54);
  helmG.addColorStop(0, "#FDE047");
  helmG.addColorStop(0.6, "#F59E0B");
  helmG.addColorStop(1, "#B45309");
  ctx.fillStyle = helmG;
  ctx.beginPath();
  ctx.arc(0, headY - 14, 48, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  // Pinggiran helm
  drawRoundedRect(ctx, -58, headY - 20, 116, 12, 6);
  ctx.fill();

  // Tangan & Alat Kerja menuju tembok kiri (x = 620)
  const reachX = 625 - wx; // koordinat lokal menuju permukaan tembok
  if (tool === "roller" || tool === "waterproof" || tool === "scraper") {
    const strokeY = -175 + Math.sin(time * 7) * 58;
    // Lengan kiri memegang alat
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-34, -168 + bob);
    ctx.lineTo(reachX + 32, strokeY + 24);
    ctx.stroke();
    // Telapak tangan bulat
    ctx.fillStyle = "#E8B98E";
    ctx.beginPath();
    ctx.arc(reachX + 32, strokeY + 24, 13, 0, Math.PI * 2);
    ctx.fill();

    // Alat sesuai fase
    if (tool === "roller" || tool === "waterproof") {
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(reachX + 30, strokeY + 18);
      ctx.lineTo(reachX + 12, strokeY - 14);
      ctx.stroke();
      ctx.fillStyle = tool === "waterproof" ? "#0D9488" : "#FFFBEB";
      drawRoundedRect(ctx, reachX - 2, strokeY - 36, 22, 46, 8);
      ctx.fill();
    } else if (tool === "scraper") {
      ctx.fillStyle = "#CBD5E1";
      drawRoundedRect(ctx, reachX - 2, strokeY - 12, 26, 24, 3);
      ctx.fill();
    }
  } else {
    // Tangan santai di samping badan
    ctx.fillStyle = "#E8B98E";
    ctx.beginPath();
    ctx.arc(-44, -110 + bob, 13, 0, Math.PI * 2);
    ctx.arc(44, -110 + bob, 13, 0, Math.PI * 2);
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
