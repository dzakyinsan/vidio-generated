/**
 * Pilih scene default yang aktif:
 *  - 'lateDinner'   : Makan Malam Bikin Gemuk? Jam Berapa yang Berbahaya? (32 detik)
 *  - 'chargePillow' : Bahaya Ngecas HP di Bawah Bantal / Kasur (31 detik)
 *  - 'biogas'       : Demo Instalasi Biogas Rumahan (22 detik)
 */
const ACTIVE_SCENE = "lateDinner";

export const SCENE_PRESETS = {
  lateDinner: {
    scene: "lateDinner",
    title: "Makan Malam Bikin Gemuk? (43s)",
    duration: 43,
    outputPath: "output/makan-malam-bikin-gemuk.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-late-dinner.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.14,
        loop: true,
      },
      sfx: [
        { file: "assets/audio/sfx-clock.wav", start: 0.2, end: 5.5, volume: 0.42 },
        { file: "assets/audio/sfx-pop-equal.wav", start: 10.6, volume: 0.5 },
        { file: "assets/audio/sfx-reflux.wav", start: 25.5, end: 29.8, volume: 0.46 },
        { file: "assets/audio/sfx-safe.wav", start: 31.4, volume: 0.48 },
      ],
    },
    markers: [
      { label: "1. Hook: Mitos Jam 7", time: 0 },
      { label: "2. APA: 550 kkal = 550 kkal", time: 5.9 },
      { label: "3. KENAPA #1: Ritme Sirkadian", time: 15.1 },
      { label: "4. KENAPA #2: Asam Lambung (GERD)", time: 24.1 },
      { label: "5. BAGAIMANA: Jeda 2-3 Jam", time: 31.1 },
      { label: "6. CTA Follow", time: 39.3 },
    ],
  },

  chargePillow: {
    scene: "chargePillow",
    title: "Ngecas HP di Bawah Bantal (31s)",
    duration: 31,
    outputPath: "output/ngecas-hp-bawah-bantal.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-charge.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.14,
        loop: true,
      },
      sfx: [
        { file: "assets/audio/sfx-alarm.wav", start: 0.02, end: 1.7, volume: 0.42 },
        { file: "assets/audio/sfx-plug.wav", start: 1.6, volume: 0.48 },
        { file: "assets/audio/sfx-heat.wav", start: 7.9, end: 12.5, volume: 0.42 },
        { file: "assets/audio/sfx-spark.wav", start: 15.2, end: 22.0, volume: 0.5 },
        { file: "assets/audio/sfx-alarm.wav", start: 18.0, end: 19.6, volume: 0.32 },
        { file: "assets/audio/sfx-safe.wav", start: 23.0, volume: 0.5 },
      ],
    },
    markers: [
      { label: "1. Hook: HP di Bawah Bantal", time: 0 },
      { label: "2. Panas Alami Charging", time: 3.8 },
      { label: "3. Isolator Panas", time: 7.9 },
      { label: "4. X-Ray Thermal Runaway", time: 12.7 },
      { label: "5. Asap & Risiko Api", time: 18.0 },
      { label: "6. Solusi Aman di Meja", time: 22.6 },
      { label: "7. CTA Follow", time: 27.7 },
    ],
  },

  biogas: {
    scene: "biogas",
    title: "Instalasi Biogas Rumahan (22s)",
    duration: 22,
    outputPath: "output/biogas.mp4",
    // Latar langit siang terang -> pakai versi teks gelap
    watermark: {
      enabled: true,
      file: "assets/images/watermark-dark.png",
      x: 38,
      y: 108,
      height: 78,
      opacity: 0.9,
    },
    audio: {
      voiceover: {
        file: "assets/audio/voiceover.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.14,
        loop: true,
      },
      sfx: [
        { file: "assets/audio/sfx-dig.wav", start: 0.1, end: 2.5, volume: 0.45 },
        { file: "assets/audio/sfx-drop.wav", start: 2.4, end: 5.5, volume: 0.5 },
        { file: "assets/audio/sfx-rain.wav", start: 5.7, end: 9.2, volume: 0.35 },
        { file: "assets/audio/sfx-bubbles.wav", start: 10.8, end: 13.4, volume: 0.45 },
        { file: "assets/audio/sfx-flame.wav", start: 15.2, end: 17.8, volume: 0.55 },
      ],
    },
    markers: [
      { label: "1. Gali Lubang", time: 0 },
      { label: "2. Sampah Dapur", time: 2.5 },
      { label: "3. Hujan & Bau", time: 5.8 },
      { label: "4. Tangki & Bakteri", time: 9.1 },
      { label: "5. Pipa ke Kompor", time: 13.4 },
      { label: "6. Hasil Akhir", time: 17.4 },
    ],
  },
};

export function getVideoConfig(sceneName = ACTIVE_SCENE) {
  const preset = SCENE_PRESETS[sceneName] || SCENE_PRESETS[ACTIVE_SCENE];
  return {
    width: 1080,
    height: 1920,
    fps: 30,
    // Watermark otomatis tampil di semua video (default teks putih untuk latar gelap)
    watermark: {
      enabled: true,
      file: "assets/images/watermark-light.png",
      x: 38,
      y: 108,
      height: 78,
      opacity: 0.88,
    },
    ffmpeg: {
      crf: 20,
      preset: "medium",
    },
    ...preset,
  };
}

export const VIDEO_CONFIG = getVideoConfig(ACTIVE_SCENE);
