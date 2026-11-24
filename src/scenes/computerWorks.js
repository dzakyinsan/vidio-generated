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

// Load gambar cover GTA VI untuk layar monitor (bekerja di Browser Live Preview & Node.js MP4 Renderer)
let gta6Image = null;
if (typeof window !== "undefined") {
  const img = new Image();
  img.src = "/assets/images/gta6-cover.jpg";
  img.onload = () => {
    gta6Image = img;
  };
} else {
  try {
    const [{ loadImage }, { fileURLToPath }, pathMod] = await Promise.all([
      import("@napi-rs/canvas"),
      import("url"),
      import("path"),
    ]);
    const dir = pathMod.dirname(fileURLToPath(import.meta.url));
    gta6Image = await loadImage(
      pathMod.resolve(dir, "../../assets/images/gta6-cover.jpg"),
    );
  } catch {
    gta6Image = null;
  }
}

/**
 * Film Animasi 1-Shot Sinematik (106 Detik — Opening + 10 Fakta):
 * "Tahukah Kamu? Bagaimana Komputer Bekerja di Balik Layar?"
 *
 * 1 Dunia Terpadu (Meja Monitor di atas + Motherboard PCB Hidup di bawah):
 *  - Opening  (0.0 - 9.0s)  : Klik aplikasi di monitor -> zoom menyelam ke dalam motherboard!
 *  - Fakta 1  (9.0 - 18.5s) : CPU — Otak komputer pengatur instruksi & perhitungan
 *  - Fakta 2  (18.5 - 28.0s): RAM — Tempat kerja sementara, aliran cepat SSD -> RAM -> CPU
 *  - Fakta 3  (28.0 - 37.5s): RAM Volatile — Saat listrik mati, data RAM langsung lenyap!
 *  - Fakta 4  (37.5 - 47.0s): CPU Cache — Memori super cepat di dalam chip CPU
 *  - Fakta 5  (47.0 - 56.5s): Multi-Core — 8 Core & 16 Thread bekerja paralel
 *  - Fakta 6  (56.5 - 66.0s): SSD vs RAM — Permanen vs Sementara berdampingan
 *  - Fakta 7  (66.0 - 75.5s): GPU — Bukan hanya gaming, juga video, 3D, rendering & AI!
 *  - Fakta 8  (75.5 - 85.0s): Motherboard — Pull-back luas semua komponen saling terhubung
 *  - Fakta 9  (85.0 - 94.0s): Miliaran Operasi — Gelombang clock GHz super cepat di CPU
 *  - Fakta 10 (94.0 - 106s) : Komputer diam tapi tetap bekerja (OS background) + "+ FOLLOW"
 */

const CAMERA_KEYFRAMES = [
  { time: 0.0, x: 540, y: 460, zoom: 1.0 }, // Opening: Layar Monitor GTA VI + Klik PLAY
  { time: 12.2, x: 540, y: 460, zoom: 1.08 },
  { time: 14.0, x: 760, y: 1180, zoom: 1.28, ease: easeInOutCubic }, // Fakta 1 (14.0s): CPU Otak Komputer
  { time: 24.4, x: 760, y: 1180, zoom: 1.28 },
  { time: 25.6, x: 1280, y: 1180, zoom: 1.18, ease: easeInOutCubic }, // Fakta 2 (25.0s): RAM Kerja Sementara
  { time: 36.4, x: 1280, y: 1180, zoom: 1.18 },
  { time: 37.6, x: 1320, y: 1180, zoom: 1.22, ease: easeInOutCubic }, // Fakta 3 (37.0s): RAM Volatile (Power Off)
  { time: 48.4, x: 1320, y: 1180, zoom: 1.22 },
  { time: 49.8, x: 760, y: 1180, zoom: 1.56, ease: easeInOutCubic }, // Fakta 4 (49.1s): Macro CPU Cache
  { time: 60.0, x: 760, y: 1180, zoom: 1.56 },
  { time: 61.2, x: 760, y: 1180, zoom: 1.48, ease: easeInOutCubic }, // Fakta 5 (60.6s): 8 Core / 16 Thread
  { time: 71.4, x: 760, y: 1180, zoom: 1.48 },
  { time: 72.8, x: 1520, y: 1180, zoom: 0.98, ease: easeInOutCubic }, // Fakta 6 (72.0s): SSD vs RAM berdampingan
  { time: 84.2, x: 1520, y: 1180, zoom: 0.98 },
  { time: 85.8, x: 820, y: 1580, zoom: 1.16, ease: easeInOutCubic }, // Fakta 7 (85.0s): GPU (GTA VI, 3D, AI)
  { time: 98.8, x: 820, y: 1580, zoom: 1.16 },
  { time: 100.4, x: 1240, y: 1340, zoom: 0.64, ease: easeInOutCubic }, // Fakta 8 (99.6s): Full Motherboard Pull-Back
  { time: 110.0, x: 1240, y: 1340, zoom: 0.64 },
  { time: 111.4, x: 760, y: 1180, zoom: 1.44, ease: easeInOutCubic }, // Fakta 9 (110.6s): Miliaran Siklus Clock (GHz)
  { time: 120.2, x: 760, y: 1180, zoom: 1.44 },
  { time: 121.8, x: 540, y: 500, zoom: 0.98, ease: easeInOutCubic }, // Fakta 10 (121.0s): Monitor Diam + OS Background
  { time: 136.0, x: 540, y: 500, zoom: 0.98 },
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
  const w = Math.max(210, ctx.measureText(text).width + 52);
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

function getCurrentFactBadge(time) {
  if (time < 14.0) return null;
  if (time < 25.0) return { num: "FAKTA 1", label: "CPU = OTAK KOMPUTER", color: "#0EA5E9" };
  if (time < 37.0) return { num: "FAKTA 2", label: "RAM = MEJA KERJA SEMENTARA", color: "#22C55E" };
  if (time < 49.1) return { num: "FAKTA 3", label: "RAM BERSIFAT VOLATILE", color: "#EF4444" };
  if (time < 60.6) return { num: "FAKTA 4", label: "CPU CACHE = SUPER CEPAT", color: "#F59E0B" };
  if (time < 72.0) return { num: "FAKTA 5", label: "8 CORE & 16 THREAD PARALEL", color: "#A855F7" };
  if (time < 85.0) return { num: "FAKTA 6", label: "SSD (PERMANEN) vs RAM (AKTIF)", color: "#06B6D4" };
  if (time < 99.6) return { num: "FAKTA 7", label: "GPU: GRAFIK GTA VI, 3D & AI", color: "#EC4899" };
  if (time < 110.6) return { num: "FAKTA 8", label: "MOTHERBOARD PENGHUBUNG UTAMA", color: "#10B981" };
  if (time < 121.0) return { num: "FAKTA 9", label: "MILIARAN SIKLUS / DETIK", color: "#F97316" };
  if (time < 132.2) return { num: "FAKTA 10", label: "AKTIF DI BALIK LAYAR", color: "#38BDF8" };
  return null;
}

export function drawComputerWorksScene(ctx, time, width, height) {
  const camera = evaluateCamera(CAMERA_KEYFRAMES, time);

  // Power-off blackout effect di Fakta 3 (41.2s - 46.8s)
  const powerOff =
    progress(time, 41.0, 42.0, easeInOutCubic) *
    (1 - progress(time, 46.2, 47.4, easeInOutCubic));

  // Latar gelap luar angkasa/tech
  ctx.fillStyle = "#060B18";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  applyCamera(ctx, camera, width, height);

  // 1. ZONA ATAS (x = 540, y = 460): Meja Komputer & Monitor (Opening & Fakta 10)
  drawMonitorZone(ctx, time);

  // 2. ZONA BAWAH (x = 300..2150, y = 860..1860): Papan Motherboard PCB Hidup
  drawMotherboardWorld(ctx, time, powerOff);

  ctx.restore();

  // 3. Overlay Screen-Space (Hook awal + Pill Fakta atas + CTA Follow akhir)
  if (time < 4.5) {
    drawOpeningHook(ctx, time, width, height);
  }

  const badge = getCurrentFactBadge(time);
  if (badge) {
    drawAutoPill(
      ctx,
      width / 2,
      height * 0.16,
      `${badge.num}  •  ${badge.label}`,
      "900 28px Arial, sans-serif",
      "rgba(15, 23, 42, 0.90)",
      "#F8FAFC",
      badge.color,
      58,
    );
  }

  if (time >= 132.0) {
    const pop = progress(time, 132.2, 132.8, easeOutBack);
    drawFollowCTA(ctx, width, height, pop, time);
  }
}

function drawMonitorZone(ctx, time) {
  const cx = 540;
  const cy = 470;
  const isIdleScene = time >= 120.8;

  // Glow latar belakang monitor
  const bgGlow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 460);
  bgGlow.addColorStop(0, "rgba(56, 189, 248, 0.22)");
  bgGlow.addColorStop(1, "rgba(6, 11, 24, 0)");
  ctx.fillStyle = bgGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, 460, 0, Math.PI * 2);
  ctx.fill();

  // Penyangga & Meja Monitor
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, cx - 34, cy + 160, 68, 86, 8);
  ctx.fill();
  ctx.fillStyle = "#334155";
  drawRoundedRect(ctx, cx - 120, cy + 236, 240, 22, 10);
  ctx.fill();

  // Bezel Monitor
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, cx - 320, cy - 175, 640, 350, 22);
  ctx.fill();
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Layar Monitor — Vice City / GTA VI Neon Sunset di Opening, X-Ray OS di Fakta 10
  const screenG = ctx.createLinearGradient(
    cx - 300,
    cy - 155,
    cx - 300,
    cy + 155,
  );
  if (!isIdleScene) {
    screenG.addColorStop(0, "#3B0764");
    screenG.addColorStop(0.55, "#DB2777");
    screenG.addColorStop(1, "#FB923C");
  } else {
    screenG.addColorStop(0, "#0C4A6E");
    screenG.addColorStop(1, "#1E1B4B");
  }
  ctx.fillStyle = screenG;
  drawRoundedRect(ctx, cx - 300, cy - 155, 600, 310, 12);
  ctx.fill();

  if (!isIdleScene) {
    // Tampilkan gambar GTA VI asli di dalam layar monitor (dengan rounded clip + efek zoom halus)
    const clickProg = progress(time, 1.4, 2.2, easeOutCubic);
    const appScale = 1 + Math.sin(clickProg * Math.PI) * 0.08;

    if (gta6Image && gta6Image.width && gta6Image.height) {
      ctx.save();
      drawRoundedRect(ctx, cx - 300, cy - 155, 600, 310, 12);
      ctx.clip();
      const sw = 600;
      const sh = 310;
      const scale = Math.max(sw / gta6Image.width, sh / gta6Image.height) * appScale;
      const dw = gta6Image.width * scale;
      const dh = gta6Image.height * scale;
      ctx.drawImage(gta6Image, cx - dw / 2, cy - dh / 2, dw, dh);
      // Gradient gelap tipis di bawah layar agar tombol PLAY terbaca jelas
      const overlay = ctx.createLinearGradient(0, cy + 35, 0, cy + 155);
      overlay.addColorStop(0, "rgba(0, 0, 0, 0)");
      overlay.addColorStop(1, "rgba(0, 0, 0, 0.72)");
      ctx.fillStyle = overlay;
      ctx.fillRect(cx - 300, cy + 35, 600, 120);
      ctx.restore();
    } else {
      // Fallback vektor Vice City jika gambar belum termuat
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(cx, cy + 25, 72, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(cx - 300, cy + 25, 600, 130);
    }

    // Tombol ▶ PLAY di bawah layar monitor yang diklik kursor
    ctx.save();
    ctx.translate(cx, cy + 106);
    ctx.scale(appScale, appScale);
    ctx.fillStyle = "#22C55E";
    drawRoundedRect(ctx, -84, -23, 168, 46, 23);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▶ PLAY", 0, 1);
    ctx.restore();

    // Riak klik menyebar dari tombol PLAY
    if (time >= 1.6) {
      const r = ((time - 1.6) * 140) % 240;
      ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - r / 240)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + 106, 35 + r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Kursor mouse bergerak mengklik tombol PLAY GTA VI
    const curX = lerp(
      cx + 185,
      cx + 18,
      progress(time, 0.3, 1.5, easeInOutCubic),
    );
    const curY = lerp(
      cy + 145,
      cy + 108,
      progress(time, 0.3, 1.5, easeInOutCubic),
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX + 26, curY + 14);
    ctx.lineTo(curX + 12, curY + 20);
    ctx.lineTo(curX + 6, curY + 34);
    ctx.closePath();
    ctx.fill();

    // Aliran biner (0/1) mengalir turun dari monitor menuju motherboard di bawah!
    ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
    ctx.font = "bold 20px monospace";
    for (let i = 0; i < 8; i++) {
      const py = ((time * 160 + i * 55) % 340) + cy + 170;
      const px = cx - 90 + (i % 4) * 60;
      ctx.fillText(i % 2 === 0 ? "01" : "10", px, py);
    }
  } else {
    // Fakta 10: Monitor terlihat diam, tapi panel X-Ray background OS tetap sibuk!
    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAYAR DIAM (IDLE) — TAPI OS TETAP BEKERJA!", cx, cy - 110);

    const tasks = [
      { label: "🧠 Kelola Memori", y: cy - 50, color: "#38BDF8", speed: 2.8 },
      { label: "🔌 Periksa Perangkat", y: cy + 8, color: "#22C55E", speed: 2.1 },
      { label: "⚙️ Layanan Latar Belakang", y: cy + 66, color: "#F59E0B", speed: 3.4 },
    ];
    for (const tk of tasks) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      drawRoundedRect(ctx, cx - 255, tk.y - 22, 510, 44, 10);
      ctx.fill();
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "700 18px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(tk.label, cx - 235, tk.y + 6);

      // Bar aktivitas bergerak real-time
      const barW = 70 + 85 * (0.5 + 0.5 * Math.sin(time * tk.speed));
      ctx.fillStyle = tk.color;
      drawRoundedRect(ctx, cx + 65, tk.y - 10, barW, 20, 6);
      ctx.fill();
    }
  }
}

function drawMotherboardWorld(ctx, time, powerOff) {
  const boardAlpha = 1 - powerOff * 0.55;

  // Papan PCB Motherboard Hijau Tua / Navy
  ctx.save();
  ctx.fillStyle = lerpColor("#0A2520", "#050A12", powerOff);
  drawRoundedRect(ctx, 260, 880, 1860, 960, 36);
  ctx.fill();
  ctx.strokeStyle = lerpColor("#10B981", "#1E293B", powerOff);
  ctx.lineWidth = 8;
  ctx.stroke();

  // Grid jalur sirkuit PCB tipis
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.18 * boardAlpha})`;
  ctx.lineWidth = 2;
  for (let x = 320; x <= 2060; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 900);
    ctx.lineTo(x, 1820);
    ctx.stroke();
  }
  for (let y = 940; y <= 1780; y += 80) {
    ctx.beginPath();
    ctx.moveTo(280, y);
    ctx.lineTo(2100, y);
    ctx.stroke();
  }

  // Jalur Bus Emas Utama antar Komponen (CPU <-> RAM <-> SSD <-> GPU)
  const highlightBus = time >= 99.5 && time <= 110.8 ? 1.0 : 0.65;
  drawBusTrace(ctx, 900, 1180, 1170, 1180, "#38BDF8", time, powerOff, highlightBus, 2.2); // CPU <-> RAM
  drawBusTrace(ctx, 1390, 1180, 1650, 1180, "#F59E0B", time, powerOff, highlightBus, 1.5); // RAM <-> SSD
  drawBusTrace(ctx, 760, 1320, 760, 1465, "#EC4899", time, powerOff, highlightBus, 2.0); // CPU <-> GPU
  drawBusTrace(ctx, 1070, 1580, 1780, 1300, "#10B981", time, powerOff, highlightBus, 1.4); // GPU <-> SSD

  // --- KOMPONEN 1: CPU (x = 760, y = 1180) ---
  drawCPUComponent(ctx, 760, 1180, time, powerOff);

  // --- KOMPONEN 2: RAM (x = 1280, y = 1180) ---
  drawRAMComponent(ctx, 1280, 1180, time, powerOff);

  // --- KOMPONEN 3: SSD NVMe (x = 1780, y = 1180) ---
  drawSSDComponent(ctx, 1780, 1180, time);

  // --- KOMPONEN 4: GPU Graphics Card (x = 820, y = 1580) ---
  drawGPUComponent(ctx, 820, 1580, time, powerOff);

  // Label Motherboard saat pull-back Fakta 8 (100s - 110.6s)
  if (time >= 100.0 && time <= 110.6) {
    const a = progress(time, 100.2, 101.0) * (1 - progress(time, 109.8, 110.6));
    ctx.save();
    ctx.globalAlpha = a;
    drawAutoPill(
      ctx,
      1240,
      955,
      "🔌 MOTHERBOARD — JARINGAN KOMUNIKASI UTAMA",
      "900 32px Arial, sans-serif",
      "rgba(6, 78, 59, 0.94)",
      "#ECFDF5",
      "#34D399",
      66,
    );
    ctx.restore();
  }

  ctx.restore();
}

function drawBusTrace(ctx, x1, y1, x2, y2, color, time, powerOff, intensity, speed) {
  ctx.save();
  ctx.strokeStyle = powerOff > 0.5 ? "#1E293B" : color;
  ctx.globalAlpha = powerOff > 0.5 ? 0.35 : 0.45 * intensity;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (powerOff < 0.4) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 4; i++) {
      const p = (time * speed + i * 0.25) % 1;
      const px = lerp(x1, x2, p);
      const py = lerp(y1, y2, p);
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCPUComponent(ctx, cx, cy, time, powerOff) {
  const showCache = time >= 49.1 && time <= 60.6;
  const showCores = time >= 60.6 && time <= 72.0;
  const showClock = time >= 110.6 && time <= 121.0;

  ctx.save();
  ctx.translate(cx, cy);

  // Pin emas di sekeliling soket CPU
  ctx.fillStyle = "#F59E0B";
  for (let i = -5; i <= 5; i++) {
    ctx.fillRect(i * 22 - 4, -148, 8, 16);
    ctx.fillRect(i * 22 - 4, 132, 8, 16);
    ctx.fillRect(-148, i * 22 - 4, 16, 8);
    ctx.fillRect(132, i * 22 - 4, 16, 8);
  }

  // Badan Chip CPU
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -135, -135, 270, 270, 22);
  ctx.fill();
  ctx.strokeStyle = powerOff > 0.5 ? "#334155" : "#38BDF8";
  ctx.lineWidth = 6;
  ctx.stroke();

  if (showCache) {
    // Fakta 4: Memori CACHE (L1/L2/L3) bersinar emas super cepat di dalam CPU!
    const pulse = 1 + Math.sin(time * 12) * 0.05;
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
    drawRoundedRect(ctx, -108, -108, 216, 216, 18);
    ctx.fill();
    ctx.strokeStyle = "#FBBF24";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#FDE047";
    ctx.font = "900 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ CPU CACHE", 0, -24);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillText("L1 • L2 • L3", 0, 14);
    ctx.fillStyle = "#86EFAC";
    ctx.font = "700 18px Arial, sans-serif";
    ctx.fillText("Jauh Lebih Cepat dari RAM!", 0, 52);
  } else if (showCores) {
    // Fakta 5: 8 Core menyala bekerja paralel!
    ctx.fillStyle = "#E9D5FF";
    ctx.font = "900 20px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("8 CORE • 16 THREAD", 0, -96);

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const bx = -104 + c * 54;
        const by = -68 + r * 76;
        const glow = 0.55 + 0.45 * Math.sin(time * 9 + idx * 0.9);
        ctx.fillStyle = `rgba(168, 85, 247, ${glow})`;
        drawRoundedRect(ctx, bx, by, 44, 60, 8);
        ctx.fill();
        ctx.strokeStyle = "#E9D5FF";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 16px Arial, sans-serif";
        ctx.fillText(`C${idx + 1}`, bx + 22, by + 35);
      }
    }
  } else if (showClock) {
    // Fakta 9: Gelombang Miliaran Siklus Clock/detik!
    for (let i = 0; i < 3; i++) {
      const r = ((time * 180 + i * 55) % 160) + 20;
      ctx.strokeStyle = `rgba(249, 115, 22, ${Math.max(0, 1 - r / 180)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#FB923C";
    ctx.font = "900 34px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("3.5+ GHz", 0, -14);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 18px Arial, sans-serif";
    ctx.fillText("MILIARAN SIKLUS / DTK", 0, 26);
  } else {
    // Tampilan default CPU: Otak Komputer
    const pulse = 1 + Math.sin(time * 5) * 0.04;
    ctx.fillStyle = "#0F172A";
    drawRoundedRect(ctx, -95, -95, 190, 190, 16);
    ctx.fill();
    ctx.strokeStyle = powerOff > 0.5 ? "#334155" : "#0EA5E9";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.fillStyle = powerOff > 0.5 ? "#64748B" : "#38BDF8";
    ctx.font = "900 44px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CPU", 0, -6);
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "700 18px Arial, sans-serif";
    ctx.fillText("OTAK KOMPUTER", 0, 32);
    ctx.restore();
  }

  ctx.restore();
}

function drawRAMComponent(ctx, cx, cy, time, powerOff) {
  ctx.save();
  ctx.translate(cx, cy);

  // 2 Batang Modul RAM Vertikal
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? -58 : 16;
    ctx.fillStyle = lerpColor("#064E3B", "#1E293B", powerOff);
    drawRoundedRect(ctx, sx, -135, 48, 270, 8);
    ctx.fill();
    ctx.strokeStyle = lerpColor("#22C55E", "#334155", powerOff);
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4 Chip IC di dalam RAM yang menampung data sementara (hilang saat powerOff!)
    for (let c = 0; c < 4; c++) {
      const cyChip = -112 + c * 60;
      ctx.fillStyle = "#0F172A";
      drawRoundedRect(ctx, sx + 8, cyChip, 32, 42, 4);
      ctx.fill();

      if (powerOff < 0.7) {
        const active = (1 - powerOff) * (0.45 + 0.55 * Math.abs(Math.sin(time * 5 + c + s * 2)));
        ctx.fillStyle = `rgba(74, 222, 128, ${active})`;
        drawRoundedRect(ctx, sx + 13, cyChip + 6, 22, 30, 3);
        ctx.fill();
      }
    }
  }

  // Label bawah RAM
  drawAutoPill(
    ctx,
    0,
    180,
    powerOff > 0.45 ? "⚡ MATI → DATA HILANG!" : "RAM (SEMENTARA)",
    "900 22px Arial, sans-serif",
    powerOff > 0.45 ? "#B91C1C" : "#15803D",
    "#FFFFFF",
    null,
    46,
  );

  ctx.restore();
}

function drawSSDComponent(ctx, cx, cy, time) {
  ctx.save();
  ctx.translate(cx, cy);

  // Modul SSD NVMe (Tetap menyala hangat menyimpan file permanen walau listrik mati!)
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -110, -76, 220, 152, 16);
  ctx.fill();
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Chip NAND Flash di dalam SSD
  ctx.fillStyle = "#0F172A";
  drawRoundedRect(ctx, -84, -46, 72, 92, 8);
  ctx.fill();
  drawRoundedRect(ctx, 10, -46, 72, 92, 8);
  ctx.fill();

  // Ikon Gembok / Permanen
  const glow = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SSD", -48, 10);
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("🔒", 46, 12);

  drawAutoPill(
    ctx,
    0,
    126,
    "SSD (PERMANEN)",
    "900 22px Arial, sans-serif",
    "#B45309",
    "#FFFFFF",
    null,
    46,
  );

  ctx.restore();
}

function drawGPUComponent(ctx, cx, cy, time, powerOff) {
  ctx.save();
  ctx.translate(cx, cy);

  // Kartu Grafis GPU Dual-Fan
  ctx.fillStyle = "#1E293B";
  drawRoundedRect(ctx, -230, -105, 460, 210, 22);
  ctx.fill();
  ctx.strokeStyle = powerOff > 0.5 ? "#334155" : "#EC4899";
  ctx.lineWidth = 5;
  ctx.stroke();

  // 2 Kipas GPU berputar cepat!
  const fanSpeed = powerOff > 0.5 ? 0 : time * 12;
  for (const fx of [-108, 108]) {
    ctx.save();
    ctx.translate(fx, 0);
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#F472B6";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.rotate(fanSpeed);
    ctx.fillStyle = "#334155";
    for (let b = 0; b < 6; b++) {
      ctx.rotate(Math.PI / 3);
      drawRoundedRect(ctx, -8, -62, 16, 52, 6);
      ctx.fill();
    }
    ctx.fillStyle = "#EC4899";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Label GPU + 4 Beban Kerja di Fakta 7 (66s - 75.5s)
  drawAutoPill(
    ctx,
    0,
    152,
    "GPU • GRAFIS • VIDEO • 3D • AI",
    "900 22px Arial, sans-serif",
    "#BE185D",
    "#FFFFFF",
    "#F9A8D4",
    48,
  );

  ctx.restore();
}

function drawOpeningHook(ctx, time, width, height) {
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
    "🎮 TAHUKAH KAMU?",
    "900 34px Arial, sans-serif",
    "#DB2777",
    "#FEF08A",
    "#F9A8D4",
    70,
  );

  ctx.lineJoin = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.font = "900 46px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText("RAHASIA GRAFIK & DUNIA", 0, 10);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("RAHASIA GRAFIK & DUNIA", 0, 10);

  ctx.strokeText("GTA VI DI BALIK LAYAR!", 0, 72);
  ctx.fillStyle = "#FDE047";
  ctx.fillText("GTA VI DI BALIK LAYAR!", 0, 72);
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
