/**
 * Mini 3D Engine untuk Canvas 2D (Zero-Dependency, jalan identik di Browser & Node.js).
 * Mendukung:
 *  - Proyeksi perspektif 3D -> 2D
 *  - Rotasi 3 sumbu (rx, ry, rz)
 *  - Backface culling & Painter's algorithm (depth sorting)
 *  - Pencahayaan directional (Lambertian flat shading)
 *  - Primitif 3D siap pakai: Box, Cylinder, Sphere, Cone, Torus
 */

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shadeColor(hex, intensity) {
  const { r, g, b } = hexToRgb(hex);
  const k = Math.max(0.18, Math.min(1.25, intensity));
  return `rgb(${Math.min(255, Math.round(r * k))}, ${Math.min(255, Math.round(g * k))}, ${Math.min(255, Math.round(b * k))})`;
}

function rotatePoint(p, rx, ry, rz) {
  let { x, y, z } = p;

  // Rotasi sumbu X
  if (rx) {
    const c = Math.cos(rx), s = Math.sin(rx);
    const ny = y * c - z * s;
    const nz = y * s + z * c;
    y = ny; z = nz;
  }
  // Rotasi sumbu Y
  if (ry) {
    const c = Math.cos(ry), s = Math.sin(ry);
    const nx = x * c + z * s;
    const nz = -x * s + z * c;
    x = nx; z = nz;
  }
  // Rotasi sumbu Z
  if (rz) {
    const c = Math.cos(rz), s = Math.sin(rz);
    const nx = x * c - y * s;
    const ny = x * s + y * c;
    x = nx; y = ny;
  }
  return { x, y, z };
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Menggambar mesh 3D ({ vertices, faces }) ke Canvas 2D.
 */
export function drawMesh3D(ctx, mesh, options = {}) {
  const {
    x = 540,
    y = 960,
    rx = 0,
    ry = 0,
    rz = 0,
    scale = 1,
    fov = 750,
    viewerZ = 480,
    lightDir = { x: -0.4, y: -0.6, z: -0.7 },
    ambient = 0.36,
    strokeColor = null,
    strokeWidth = 1,
    cullBackfaces = true,
  } = options;

  const light = normalize(lightDir);

  // 1. Transformasi semua vertex ke ruang 3D kamera
  const transformed = mesh.vertices.map((v) => {
    const r = rotatePoint(
      { x: v.x * scale, y: v.y * scale, z: v.z * scale },
      rx,
      ry,
      rz
    );
    const depth = viewerZ + r.z;
    const proj = fov / Math.max(40, depth);
    return {
      x: r.x,
      y: r.y,
      z: r.z,
      sx: x + r.x * proj,
      sy: y + r.y * proj,
    };
  });

  // 2. Hitung normal, pencahayaan, backface culling, dan rata-rata Z tiap face
  const renderFaces = [];
  for (const face of mesh.faces) {
    const pts = face.indices.map((idx) => transformed[idx]);
    if (pts.length < 3) continue;

    // Cross product 3D untuk normal permukaan
    const ux = pts[1].x - pts[0].x;
    const uy = pts[1].y - pts[0].y;
    const uz = pts[1].z - pts[0].z;
    const vx = pts[2].x - pts[0].x;
    const vy = pts[2].y - pts[0].y;
    const vz = pts[2].z - pts[0].z;

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;

    // Backface culling (kamera menghadap +Z dari -Z, jadi normal menghadap kamera punya nz < 0)
    if (cullBackfaces && nz >= 0) continue;

    const n = normalize({ x: nx, y: ny, z: nz });
    const diff = Math.max(0, n.x * light.x + n.y * light.y + n.z * light.z);
    const intensity = ambient + (1 - ambient) * diff * 0.9;

    const avgZ = pts.reduce((acc, p) => acc + p.z, 0) / pts.length;
    renderFaces.push({
      pts,
      avgZ,
      fill: shadeColor(face.color || '#38BDF8', intensity),
    });
  }

  // 3. Painter's algorithm: gambar dari belakang (Z besar) ke depan (Z kecil)
  renderFaces.sort((a, b) => b.avgZ - a.avgZ);

  ctx.save();
  ctx.lineJoin = 'round';
  for (const f of renderFaces) {
    ctx.beginPath();
    ctx.moveTo(f.pts[0].sx, f.pts[0].sy);
    for (let i = 1; i < f.pts.length; i++) {
      ctx.lineTo(f.pts[i].sx, f.pts[i].sy);
    }
    ctx.closePath();
    ctx.fillStyle = f.fill;
    ctx.fill();

    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    } else {
      // Stroke tipis sewarna untuk menutup celah anti-aliasing antar poligon
      ctx.strokeStyle = f.fill;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ============================================================================
// PRIMITIF 3D SIAP PAKAI (Box, Cylinder, Sphere, Cone, Torus)
// ============================================================================

/**
 * Balok / Kubus 3D. Bisa diberi warna berbeda per sisi lewat `faceColors`.
 */
export function createBox3D(w, h, d, color = '#38BDF8', faceColors = {}) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const vertices = [
    { x: -hw, y: -hh, z: -hd }, // 0: depan kiri atas
    { x: hw, y: -hh, z: -hd },  // 1: depan kanan atas
    { x: hw, y: hh, z: -hd },   // 2: depan kanan bawah
    { x: -hw, y: hh, z: -hd },  // 3: depan kiri bawah
    { x: -hw, y: -hh, z: hd },  // 4: belakang kiri atas
    { x: hw, y: -hh, z: hd },   // 5: belakang kanan atas
    { x: hw, y: hh, z: hd },    // 6: belakang kanan bawah
    { x: -hw, y: hh, z: hd },   // 7: belakang kiri bawah
  ];

  // Urutan counter-clockwise dilihat dari luar agar normal mengarah keluar
  const faces = [
    { indices: [0, 3, 2, 1], color: faceColors.front || color },
    { indices: [5, 6, 7, 4], color: faceColors.back || color },
    { indices: [4, 7, 3, 0], color: faceColors.left || color },
    { indices: [1, 2, 6, 5], color: faceColors.right || color },
    { indices: [4, 0, 1, 5], color: faceColors.top || color },
    { indices: [3, 7, 6, 2], color: faceColors.bottom || color },
  ];

  return { vertices, faces };
}

/**
 * Silinder / Tabung 3D (cocok untuk baterai, tangki, koin, gelas, jam).
 */
export function createCylinder3D(
  radius = 60,
  height = 140,
  segments = 24,
  color = '#22C55E',
  capColor = null
) {
  const hh = height / 2;
  const vertices = [];
  const faces = [];

  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const cx = Math.cos(a) * radius;
    const cz = Math.sin(a) * radius;
    vertices.push({ x: cx, y: -hh, z: cz }); // top ring: 2*i
    vertices.push({ x: cx, y: hh, z: cz });  // bot ring: 2*i + 1
  }

  const topIndices = [];
  const botIndices = [];

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const t0 = i * 2;
    const b0 = i * 2 + 1;
    const t1 = next * 2;
    const b1 = next * 2 + 1;

    faces.push({ indices: [t0, t1, b1, b0], color });
    topIndices.push(t0);
    botIndices.unshift(b0);
  }

  faces.push({ indices: topIndices, color: capColor || color });
  faces.push({ indices: botIndices, color: capColor || color });

  return { vertices, faces };
}

/**
 * Bola 3D (cocok untuk planet, atom, molekul, bola mata, bumi).
 */
export function createSphere3D(radius = 80, latSteps = 12, lonSteps = 20, color = '#F59E0B') {
  const vertices = [];
  const faces = [];

  for (let lat = 0; lat <= latSteps; lat++) {
    const theta = (lat / latSteps) * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let lon = 0; lon < lonSteps; lon++) {
      const phi = (lon / lonSteps) * Math.PI * 2;
      vertices.push({
        x: radius * sinT * Math.cos(phi),
        y: -radius * cosT,
        z: radius * sinT * Math.sin(phi),
      });
    }
  }

  for (let lat = 0; lat < latSteps; lat++) {
    for (let lon = 0; lon < lonSteps; lon++) {
      const nextLon = (lon + 1) % lonSteps;
      const a = lat * lonSteps + lon;
      const b = lat * lonSteps + nextLon;
      const c = (lat + 1) * lonSteps + nextLon;
      const d = (lat + 1) * lonSteps + lon;

      if (lat === 0) {
        faces.push({ indices: [a, d, c], color });
      } else if (lat === latSteps - 1) {
        faces.push({ indices: [a, d, b], color });
      } else {
        faces.push({ indices: [a, d, c, b], color });
      }
    }
  }

  return { vertices, faces };
}

/**
 * Cincin / Torus 3D (cocok untuk cincin planet Saturnus, orbit atom, donat).
 */
export function createTorus3D(
  majorR = 110,
  minorR = 16,
  majorSegs = 24,
  minorSegs = 10,
  color = '#A855F7'
) {
  const vertices = [];
  const faces = [];

  for (let i = 0; i < majorSegs; i++) {
    const u = (i / majorSegs) * Math.PI * 2;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    for (let j = 0; j < minorSegs; j++) {
      const v = (j / minorSegs) * Math.PI * 2;
      const r = majorR + minorR * Math.cos(v);
      vertices.push({
        x: r * cosU,
        y: minorR * Math.sin(v),
        z: r * sinU,
      });
    }
  }

  for (let i = 0; i < majorSegs; i++) {
    const ni = (i + 1) % majorSegs;
    for (let j = 0; j < minorSegs; j++) {
      const nj = (j + 1) % minorSegs;
      const a = i * minorSegs + j;
      const b = ni * minorSegs + j;
      const c = ni * minorSegs + nj;
      const d = i * minorSegs + nj;
      faces.push({ indices: [a, b, c, d], color });
    }
  }

  return { vertices, faces };
}
