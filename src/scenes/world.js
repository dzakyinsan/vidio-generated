import { createRandom, lerpColor } from '../engine/math.js';
import { drawCloud, drawPalmTree, drawRoundedRect } from '../engine/shapes.js';

// Koordinat tetap dunia (world space)
export const GROUND_Y = 980;
export const PIT_X = 330;
export const PIT_W = 420;
export const PIT_H = 420;
export const HOUSE_X = 835;
export const STOVE_X = 1045;
export const STOVE_Y = GROUND_Y - 120;

// Generate batu-batu tanah & rumput sekali secara deterministik
const rand = createRandom(2026);
const PEBBLES = Array.from({ length: 42 }, () => ({
  x: -400 + rand() * 2200,
  y: GROUND_Y + 95 + rand() * 920,
  rx: 5 + rand() * 14,
  ry: 4 + rand() * 9,
  color: rand() > 0.5 ? '#A0745A' : '#6A3F2B',
}));

const GRASS_TUFTS = Array.from({ length: 45 }, () => ({
  x: -400 + rand() * 2200,
  y: GROUND_Y - 65 + rand() * 55,
  h: 12 + rand() * 14,
}));

/**
 * Menggambar dunia latar belakang (langit, matahari, awan, bukit, pohon, rumah, tanah).
 * Mendukung transisi cuaca `rainFactor` (0..1) dan `sunsetFactor` (0..1).
 */
export function drawWorld(ctx, time, { rainFactor = 0, sunsetFactor = 0, tomatoGrowth = 0 } = {}) {
  // 1. Langit (gradasi siang -> hujan -> sore)
  let skyTop = lerpColor('#C9D7B7', '#63717D', rainFactor);
  let skyBot = lerpColor('#EFE3C2', '#8D9BA6', rainFactor);
  skyTop = lerpColor(skyTop, '#B87660', sunsetFactor);
  skyBot = lerpColor(skyBot, '#E7B082', sunsetFactor);

  const skyGrad = ctx.createLinearGradient(0, -300, 0, GROUND_Y);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-600, -400, 2600, GROUND_Y + 420);

  // 2. Matahari
  const sunAlpha = Math.max(0, 1 - rainFactor * 1.3);
  if (sunAlpha > 0.01) {
    const sunX = 1060;
    const sunY = 140 + sunsetFactor * 420;
    ctx.save();
    ctx.globalAlpha = sunAlpha;

    const glow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 170);
    glow.addColorStop(0, sunsetFactor > 0.5 ? 'rgba(255, 224, 150, 0.9)' : 'rgba(255, 246, 200, 0.85)');
    glow.addColorStop(1, 'rgba(255, 230, 150, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 170, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Awan bergerak pelan
  const cloudDrift = time * 14;
  const cloudColor = lerpColor(
    lerpColor('#FFFFFF', '#59656F', rainFactor),
    '#E8B89A',
    sunsetFactor
  );
  drawCloud(ctx, ((180 + cloudDrift) % 1800) - 300, 220, 1.05, cloudColor, 0.85);
  drawCloud(ctx, ((720 + cloudDrift * 0.7) % 1800) - 300, 310, 0.8, cloudColor, 0.75);
  drawCloud(ctx, ((1240 + cloudDrift * 1.1) % 1800) - 300, 190, 1.15, cloudColor, 0.8);

  // 4. Bukit jauh & dekat
  const farHill = lerpColor(lerpColor('#88B88E', '#587166', rainFactor), '#7D8B78', sunsetFactor);
  const nearHill = lerpColor(lerpColor('#689E74', '#465F54', rainFactor), '#5D745E', sunsetFactor);

  ctx.fillStyle = farHill;
  ctx.beginPath();
  ctx.moveTo(-600, GROUND_Y);
  ctx.quadraticCurveTo(-50, 620, 480, 740);
  ctx.quadraticCurveTo(960, 820, 1600, 670);
  ctx.lineTo(2000, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = nearHill;
  ctx.beginPath();
  ctx.moveTo(-600, GROUND_Y);
  ctx.quadraticCurveTo(180, 720, 740, 780);
  ctx.quadraticCurveTo(1280, 820, 2000, 750);
  ctx.lineTo(2000, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // 5. Pohon kelapa
  const sway = Math.sin(time * 1.6) * (1 + rainFactor * 1.4);
  drawPalmTree(ctx, 130, GROUND_Y - 60, 1.05, sway);
  drawPalmTree(ctx, -220, GROUND_Y - 60, 0.95, sway * 0.8);

  // 6. Hamparan rumput
  const grassColor = lerpColor(lerpColor('#76B947', '#4D7C3A', rainFactor), '#628B3C', sunsetFactor);
  ctx.fillStyle = grassColor;
  ctx.fillRect(-600, GROUND_Y - 82, 2600, 88);

  // Detail helai rumput
  ctx.strokeStyle = lerpColor('#4D8A2B', '#355A24', rainFactor);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const g of GRASS_TUFTS) {
    if (g.x > PIT_X - 20 && g.x < PIT_X + PIT_W + 20) continue;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x - 5, g.y - g.h);
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + 5, g.y - g.h * 0.85);
    ctx.stroke();
  }

  // 7. Kebun tomat di sisi kiri (tumbuh subur di akhir)
  drawGardenBed(ctx, -180, GROUND_Y - 52, tomatoGrowth);

  // 8. Rumah & Dapur cross-section di kanan
  drawHouse(ctx, HOUSE_X, GROUND_Y - 30, sunsetFactor);

  // 9. Potongan Tanah (Cross-section soil layers)
  // Lapisan atas tanah gelap
  ctx.fillStyle = '#5B3420';
  ctx.fillRect(-600, GROUND_Y, 2600, 70);

  // Lapisan tanah utama
  ctx.fillStyle = '#9A5434';
  ctx.fillRect(-600, GROUND_Y + 62, 2600, 1300);

  // Lapisan tanah bagian bawah lebih gelap
  ctx.fillStyle = '#87462A';
  ctx.beginPath();
  ctx.moveTo(-600, GROUND_Y + 460);
  ctx.quadraticCurveTo(250, GROUND_Y + 420, 800, GROUND_Y + 475);
  ctx.quadraticCurveTo(1350, GROUND_Y + 510, 2000, GROUND_Y + 440);
  ctx.lineTo(2000, GROUND_Y + 1400);
  ctx.lineTo(-600, GROUND_Y + 1400);
  ctx.closePath();
  ctx.fill();

  // Batu-batu kecil di dalam tanah
  for (const p of PEBBLES) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGardenBed(ctx, x, y, growth = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Petak tanah kebun
  ctx.fillStyle = '#6E4229';
  drawRoundedRect(ctx, 0, 0, 320, 44, 8);
  ctx.fill();

  // Tanaman tomat
  const stemHeight = 50 + growth * 115;
  const positions = [65, 160, 255];

  for (const px of positions) {
    // Tiang penyangga
    ctx.strokeStyle = '#8F6B4A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(px + 12, 8);
    ctx.lineTo(px + 12, -165);
    ctx.stroke();

    // Batang tanaman
    ctx.strokeStyle = '#3C8C3A';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(px, 8);
    ctx.lineTo(px, -stemHeight);
    ctx.stroke();

    // Daun
    const leafPairs = growth > 0.4 ? 3 : 2;
    ctx.fillStyle = '#4FAD48';
    for (let i = 1; i <= leafPairs; i++) {
      const ly = -i * (stemHeight / (leafPairs + 0.5));
      ctx.beginPath();
      ctx.ellipse(px - 18, ly, 16, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(px + 18, ly, 16, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Buah tomat merah muncul saat growth > 0.5
    if (growth > 0.5) {
      const r = ((growth - 0.5) / 0.5) * 11;
      ctx.fillStyle = '#E53935';
      ctx.beginPath();
      ctx.arc(px - 14, -stemHeight * 0.4, r, 0, Math.PI * 2);
      ctx.arc(px + 15, -stemHeight * 0.65, r, 0, Math.PI * 2);
      ctx.arc(px - 10, -stemHeight * 0.8, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawHouse(ctx, x, y, sunsetFactor = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Dinding rumah
  ctx.fillStyle = '#F2E7D3';
  ctx.fillRect(0, -290, 440, 290);

  // Backsplash dapur kotak-kotak biru muda
  ctx.fillStyle = '#D6EAF8';
  ctx.fillRect(160, -170, 250, 90);

  // Kabinet dapur
  ctx.fillStyle = '#C99762';
  ctx.fillRect(165, -95, 240, 95);
  ctx.strokeStyle = '#A87949';
  ctx.lineWidth = 3;
  ctx.strokeRect(165, -95, 120, 95);
  ctx.strokeRect(285, -95, 120, 95);

  // Kompor 2 tungku (di atas kabinet)
  ctx.fillStyle = '#2B2F36';
  drawRoundedRect(ctx, 180, -124, 150, 29, 6);
  ctx.fill();
  ctx.fillStyle = '#6C757D';
  ctx.beginPath();
  ctx.arc(215, -109, 6, 0, Math.PI * 2);
  ctx.arc(295, -109, 6, 0, Math.PI * 2);
  ctx.fill();

  // Rak bumbu & cangkir di atas kompor
  ctx.fillStyle = '#9C6B3E';
  ctx.fillRect(160, -195, 115, 8);
  ctx.fillStyle = '#E6B83A';
  ctx.fillRect(172, -222, 22, 27);
  ctx.fillStyle = '#E05A47';
  ctx.fillRect(202, -226, 22, 31);
  ctx.fillStyle = '#4A90D9';
  ctx.fillRect(232, -218, 22, 23);

  // Pintu rumah (kiri)
  ctx.fillStyle = '#8B5A3C';
  ctx.fillRect(36, -135, 68, 135);
  ctx.fillStyle = '#E8C56D';
  ctx.beginPath();
  ctx.arc(90, -68, 5, 0, Math.PI * 2);
  ctx.fill();

  // Jendela
  const windowColor = lerpColor('#AED6F1', '#FFE082', sunsetFactor);
  ctx.fillStyle = windowColor;
  ctx.fillRect(34, -245, 76, 76);
  ctx.strokeStyle = '#7F5A3D';
  ctx.lineWidth = 6;
  ctx.strokeRect(34, -245, 76, 76);

  ctx.fillStyle = windowColor;
  ctx.fillRect(318, -245, 84, 68);
  ctx.strokeRect(318, -245, 84, 68);

  // Atap genteng segitiga/trapesium
  ctx.fillStyle = '#C95432';
  ctx.beginPath();
  ctx.moveTo(-36, -285);
  ctx.lineTo(65, -420);
  ctx.lineTo(395, -420);
  ctx.lineTo(476, -285);
  ctx.closePath();
  ctx.fill();

  // Garis tekstur genteng
  ctx.strokeStyle = '#A84224';
  ctx.lineWidth = 4;
  for (let row = -390; row <= -305; row += 28) {
    ctx.beginPath();
    ctx.moveTo(-10, row);
    ctx.lineTo(450, row);
    ctx.stroke();
  }

  ctx.restore();
}
