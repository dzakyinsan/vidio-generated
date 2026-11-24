import {
  createBox3D,
  createCylinder3D,
  createSphere3D,
  createTorus3D,
  drawMesh3D,
} from '../engine/engine3d.js';

// Generate mesh 3D sekali di awal (hemat CPU & sangat cepat saat render MP4)
const PHONE_3D = createBox3D(120, 220, 22, '#1E293B', {
  front: '#38BDF8', // Layar biru menyala
  back: '#334155',
});
const BATTERY_3D = createCylinder3D(58, 150, 24, '#22C55E', '#CBD5E1');
const PLANET_3D = createSphere3D(78, 12, 20, '#F59E0B');
const RING_3D = createTorus3D(125, 13, 24, 10, '#38BDF8');

/**
 * Demo Showcase bentuk 3D di atas Canvas 2D (berjalan mulus di Browser & Node.js MP4).
 */
export function drawDemo3DScene(ctx, time, width, height) {
  // Latar gradien gelap modern
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(1, '#1E293B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Judul
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 46px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DEMO OBJEK 3D CANVAS', width / 2, 260);
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('Rotasi 3 sumbu + pencahayaan 3D (Browser & MP4)', width / 2, 312);

  // 1. HP 3D Berputar (kiri atas)
  drawMesh3D(ctx, PHONE_3D, {
    x: 310,
    y: 660,
    rx: Math.sin(time * 1.4) * 0.35,
    ry: time * 1.3,
    rz: 0.12,
  });
  drawLabel(ctx, 'Box 3D (HP)', 310, 860);

  // 2. Baterai Silinder 3D (kanan atas)
  drawMesh3D(ctx, BATTERY_3D, {
    x: 770,
    y: 660,
    rx: 0.45 + Math.sin(time * 1.2) * 0.2,
    ry: -time * 1.1,
    rz: -0.25,
  });
  drawLabel(ctx, 'Cylinder 3D', 770, 860);

  // 3. Planet Bola + Cincin Torus 3D (tengah bawah)
  const py = 1230;
  drawMesh3D(ctx, PLANET_3D, {
    x: width / 2,
    y: py,
    rx: 0.25,
    ry: time * 0.9,
  });
  drawMesh3D(ctx, RING_3D, {
    x: width / 2,
    y: py,
    rx: 0.55 + Math.sin(time * 1.1) * 0.15,
    ry: time * 1.2,
    rz: 0.35,
    cullBackfaces: false,
  });
  drawLabel(ctx, 'Sphere + Torus 3D', width / 2, 1420);
}

function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
