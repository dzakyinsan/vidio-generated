# Canvas Video Template (Node.js)

Template lokal untuk membuat video animasi explainer 2D vertikal **9:16 (1080×1920)** ala TikTok / Reels / YouTube Shorts menggunakan **HTML5 Canvas** di **Node.js**.

Kode animasi bersifat **deterministik (berbasis waktu `time`)** dan menggunakan 1 file render yang sama (`src/renderFrame.js`) untuk:

1. **Live Preview di Browser** (edit animasi, langsung lihat & scrub timeline tanpa render ulang).
2. **Export MP4 di Node.js** menggunakan `@napi-rs/canvas` + `ffmpeg-static` (streaming frame langsung ke FFmpeg tanpa bikin ribuan file PNG sementara).

---

## Fitur Utama

- **Kamera 2D Keyframe (`src/engine/camera.js`)**: Pan (geser kiri/kanan/atas/bawah) dan zoom in/out halus dengan easing.
- **Subtitle Karaoke (`src/engine/subtitle.js`)**: Teks putih ber-outline hitam dengan highlight kuning pada kata yang sedang diucapkan.
- **Komponen Vektor 2D Reusable (`src/engine/shapes.js`)**: Awan, pohon kelapa, pipa beranimasi + aliran gas, api biru, bakteri, sekop, sampah organik, dll.
- **Demo Scene Lengkap (`src/scenes/demoBiogas.js`)**: Contoh alur cerita biogas dari gali lubang → hujan & banjir → tangki & bakteri → pipa ke kompor → api biru & kebun tomat saat sore hari.
- **Multi-Track Audio Mixer (Voiceover + BGM + SFX)**: Atur suara narasi, musik latar (loop), dan efek suara per timestamp di `config.js`. Otomatis bunyi sinkron di Live Preview (Web Audio API) dan di-mix otomatis oleh FFmpeg saat render MP4.

---

## Cara Menjalankan

### 1. Prasyarat

Pastikan **Node.js (v18 atau lebih baru)** sudah terinstal. Cek dengan:

```bash
node -v
```

_(Tidak perlu install FFmpeg atau Visual Studio Build Tools secara manual karena template ini memakai `@napi-rs/canvas` dan `ffmpeg-static`.)_

### 2. Install Dependency

```bash
npm install
```

### 3. Live Preview di Browser (Saat Mengedit Animasi)

```bash
npm run preview
```

Lalu buka **http://localhost:8787**. Kamu bisa Play/Pause (`Space`), geser timeline, cek frame per frame (`-1f`/`+1f`), lompat antar scene, dan aktifkan overlay Safe Zone TikTok/Reels.

### 4. Render ke MP4

- **Render cepat (draft 540×960):**
  ```bash
  npm run render:draft
  ```
- **Render Full HD (1080×1920):**
  ```bash
  npm run render
  ```
- **Opsi kustom:**
  ```bash
  node scripts/render.js --fps 60 --scale 1 --out output/biogas-60fps.mp4
  ```

Hasil video akan tersimpan di `output/video.mp4`.

---

## Struktur Folder

```text
canvas-video-template/
├── config.js               # Resolusi, FPS, durasi, path audio, marker scene
├── src/
│   ├── renderFrame.js      # Entry point 1 frame (dipakai browser & Node.js)
│   ├── engine/
│   │   ├── math.js         # lerp, progress, easing, lerpColor, seeded random
│   │   ├── camera.js       # Sistem kamera 2D (pan & zoom keyframe)
│   │   ├── subtitle.js     # Subtitle karaoke highlight per kata
│   │   └── shapes.js       # Komponen ilustrasi 2D flat-vector
│   └── scenes/
│       ├── world.js        # Latar langit (siang/hujan/sore), rumah, kebun, tanah
│       ├── demoBiogas.js   # Timeline & animasi scene demo biogas
│       └── subtitles.js    # Data teks & timing subtitle
├── scripts/
│   ├── preview.js          # Server lokal untuk live preview
│   └── render.js           # Renderer headless Node.js -> MP4
├── preview/
│   └── index.html          # Player preview interaktif
└── assets/audio/           # Tempat menaruh voiceover.mp3 (opsional)
```

---

## Cara Menambahkan Suara (Voiceover, BGM, & SFX)

### Opsi Cepat: Generate SFX & BGM Otomatis Lewat Kode
Jalankan perintah ini untuk men-sintesis efek suara & BGM demo (`sfx-dig.wav`, `sfx-drop.wav`, `sfx-rain.wav`, `sfx-bubbles.wav`, `sfx-flame.wav`, `bgm.wav`) secara otomatis ke `assets/audio/`:
```bash
npm run generate:sfx
```

### Kustomisasi / Tambah Voiceover
1. Taruh file audio (`.mp3`, `.wav`, `.m4a`, atau `.ogg`) ke folder `assets/audio/` (misal `voiceover.mp3`).
2. Atur daftar track di bagian `audio` pada `config.js`:
   ```js
   audio: {
     voiceover: { file: 'assets/audio/voiceover.mp3', start: 0, volume: 1.0 },
     bgm: { file: 'assets/audio/bgm.wav', start: 0, volume: 0.22, loop: true },
     sfx: [
       { file: 'assets/audio/sfx-dig.wav', start: 0.3, end: 3.1, volume: 0.7 },
       { file: 'assets/audio/sfx-rain.wav', start: 7.0, end: 10.6, volume: 0.5 },
       { file: 'assets/audio/sfx-flame.wav', start: 17.2, end: 19.8, volume: 0.75 },
     ],
   }
   ```
3. File yang belum ada di folder `assets/audio/` akan otomatis dilewati tanpa error.
4. Di Live Preview (`http://localhost:8787`), klik **Play** untuk mendengar semua track secara sinkron, lalu jalankan `npm run render` untuk export MP4 lengkap dengan audionya.

---

## Tips Membuat Video Baru dari Template Ini

1. **Ubah durasi & marker** di `config.js`.
2. **Duplikasi `src/scenes/demoBiogas.js`** menjadi scene baru (misal `src/scenes/panelSurya.js`), lalu panggil dari `src/renderFrame.js`.
3. **Sinkronkan subtitle** di `src/scenes/subtitles.js` sesuai narasi/voiceover kamu.
4. **Taruh audio narasi** di `assets/audio/voiceover.mp3` lalu jalankan `npm run render`.
