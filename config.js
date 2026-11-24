/**
 * Pilih scene default yang aktif:
 *  - 'antMystery'    : Bagaimana Semut Temukan Makanan di Tempat Tertutup? (68 detik, Film 1-Shot)
 *  - 'asphaltPothole': Kenapa Jalan Aspal Baru Cepat Berlubang? (61 detik, 3D Stylized Cutaway)
 *  - 'javanRhino'    : Polemik Pemindahan Badak Jawa dari Ujung Kulon (92 detik, Film 1-Shot)
 *  - 'wallPeeling'   : Kenapa Cat Tembok Menggelembung & Mengelupas? (68 detik, 3D Stylized Cutaway)
 *  - 'computerWorks' : Bagaimana Komputer Bekerja di Balik Layar? (136 detik, Film 1-Shot)
 *  - 'foodLoop'      : Mengubah Limbah Makanan Menjadi Bahan Makanan Kembali (70 detik, Film 1-Shot)
 *  - 'spicyBody'     : Apa yang Terjadi pada Tubuh Saat Makan Pedas? (47 detik, Film 1-Shot)
 *  - 'fetusBreathe'  : Bagaimana Janin dalam Kandungan Bisa Bernafas? (46 detik, Film 1-Shot)
 *  - 'waterJourney'  : Bagaimana Air Bisa Sampai ke Rumah Kita? (59 detik, Film 1-Shot)
 *  - 'engineWarmup'  : Memanaskan Mesin Lama Tiap Pagi: Perlu atau Boros? (41 detik, Film 1-Shot)
 *  - 'fuelMix'       : Campur Pertamax & Pertalite dalam Satu Tangki (56 detik, Film 1-Shot)
 *  - 'lateDinner'    : Makan Malam Bikin Gemuk? Jam Berapa yang Berbahaya? (43 detik)
 *  - 'chargePillow'  : Bahaya Ngecas HP di Bawah Bantal / Kasur (31 detik)
 *  - 'biogas'        : Demo Instalasi Biogas Rumahan (22 detik)
 *  - 'demo3d'        : Demo Bentuk 3D (10 detik)
 */
const ACTIVE_SCENE = "antMystery";

export const SCENE_PRESETS = {
  antMystery: {
    scene: "antMystery",
    title: "Rahasia Semut Temukan Makanan (69s)",
    duration: 69,
    outputPath: "output/rahasia-semut-temukan-makanan.mp4",
    // Latar dapur krem terang -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-ant-mystery.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 40.0,
          end: 41.2,
          volume: 0.28,
        },
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 49.0,
          end: 56.0,
          volume: 0.34,
        },
        { file: "assets/audio/sfx-safe.wav", start: 58.4, volume: 0.46 },
      ],
    },
    markers: [
      { label: "1. Masalah: Toples Rak Tinggi", time: 0 },
      { label: "2. Macro: Celah 1mm & Kaki Lengket", time: 13.8 },
      { label: "3. Jalan Tol Feromon & Pasukan", time: 26.9 },
      { label: "4. Solusi: Air Sabun & Seal Karet", time: 48.0 },
    ],
  },

  asphaltPothole: {
    scene: "asphaltPothole",
    title: "Jalan Aspal Baru Cepat Berlubang (61s)",
    duration: 61,
    outputPath: "output/jalan-aspal-cepat-berlubang.mp4",
    // Latar langit siang terang -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-asphalt-pothole.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 13.0,
          end: 25.0,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-drop.wav",
          start: 31.8,
          end: 34.0,
          volume: 0.52,
        },
        { file: "assets/audio/sfx-safe.wav", start: 46.5, volume: 0.46 },
      ],
    },
    markers: [
      { label: "1. Jalan Baru Mulus", time: 0 },
      { label: "2. Macro: Retak & Air Meresap", time: 10.3 },
      { label: "3. Truk Lewat -> KRAK! Lubang", time: 29.0 },
      { label: "4. Solusi: Padat, Drainase & Seal", time: 38.0 },
    ],
  },

  javanRhino: {
    scene: "javanRhino",
    title: "Polemik Pemindahan Badak Jawa Ujung Kulon (92s)",
    duration: 92,
    outputPath: "output/polemik-badak-jawa-ujung-kulon.mp4",
    // Latar langit tropis terang -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-javan-rhino.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 26.5,
          end: 28.2,
          volume: 0.3,
        },
        {
          file: "assets/audio/sfx-heartbeat.wav",
          start: 44.5,
          end: 52.0,
          volume: 0.36,
        },
        { file: "assets/audio/sfx-safe.wav", start: 68.0, volume: 0.44 },
      ],
    },
    markers: [
      { label: "1. Viral di Medsos", time: 0 },
      { label: "2. Badak Jawa & Ujung Kulon", time: 6.2 },
      { label: "3. Peta Jawa -> Alas Purwo", time: 16.5 },
      { label: "4. Erupsi Anak Krakatau", time: 25.5 },
      { label: "5. Protes & Risiko Stres", time: 37.8 },
      { label: "6. Isu Peta Tambang Banten", time: 53.0 },
      { label: "7. Klarifikasi ESDM/Menhut", time: 66.0 },
      { label: "8. Penutup & Follow", time: 82.0 },
    ],
  },

  wallPeeling: {
    scene: "wallPeeling",
    title: "Cat Tembok Menggelembung & Mengelupas (68s)",
    duration: 68,
    outputPath: "output/cat-tembok-mengelupas.mp4",
    // Latar langit siang & diorama terang -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-wall-peeling.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 16.0,
          end: 26.0,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-drop.wav",
          start: 38.0,
          end: 44.5,
          volume: 0.42,
        },
        { file: "assets/audio/sfx-safe.wav", start: 54.0, volume: 0.46 },
      ],
    },
    markers: [
      { label: "1. Kondisi Awal (Awalnya Aman)", time: 0 },
      { label: "2. Macro: Pori Bata & Air Tanah", time: 14.2 },
      { label: "3. Dampak: Menggelembung & Rontok", time: 34.2 },
      { label: "4. Solusi: Waterproofing & Sealer", time: 45.2 },
    ],
  },

  computerWorks: {
    scene: "computerWorks",
    title: "Rahasia Grafik GTA VI: Cara Kerja Komputer (136s)",
    duration: 136,
    outputPath: "output/cara-kerja-komputer.mp4",
    // Latar PCB gelap futuristik -> pakai watermark versi terang (light)
    watermark: {
      enabled: true,
      file: "assets/images/watermark-light.png",
      x: 38,
      y: 108,
      height: 78,
      opacity: 0.92,
    },
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-computer-works.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.13,
        loop: true,
      },
      sfx: [
        { file: "assets/audio/sfx-safe.wav", start: 1.6, volume: 0.42 },
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 41.0,
          end: 42.2,
          volume: 0.32,
        },
        { file: "assets/audio/sfx-safe.wav", start: 100.2, volume: 0.42 },
      ],
    },
    markers: [
      { label: "Opening: GTA VI Play", time: 0 },
      { label: "Fakta 1: CPU Otak Komputer", time: 14.0 },
      { label: "Fakta 2: RAM Kerja Sementara", time: 25.0 },
      { label: "Fakta 3: RAM Volatile", time: 37.0 },
      { label: "Fakta 4: CPU Cache", time: 49.1 },
      { label: "Fakta 5: Multi-Core 8C/16T", time: 60.6 },
      { label: "Fakta 6: SSD vs RAM", time: 72.0 },
      { label: "Fakta 7: GPU (GTA VI, 3D, AI)", time: 85.0 },
      { label: "Fakta 8: Motherboard", time: 99.6 },
      { label: "Fakta 9: Miliaran Siklus/dtk", time: 110.6 },
      { label: "Fakta 10: OS Background", time: 121.0 },
    ],
  },

  foodLoop: {
    scene: "foodLoop",
    title: "Cerita Rani: Limbah Dapur Jadi Makanan (70s)",
    duration: 70,
    outputPath: "output/limbah-dapur-jadi-makanan.mp4",
    // Latar dapur & kebun terang -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-food-loop.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.13,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-drop.wav",
          start: 2.0,
          end: 9.0,
          volume: 0.42,
        },
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 37.5,
          end: 44.5,
          volume: 0.36,
        },
        { file: "assets/audio/sfx-safe.wav", start: 47.0, volume: 0.45 },
        {
          file: "assets/audio/sfx-flame.wav",
          start: 57.5,
          end: 62.5,
          volume: 0.38,
        },
      ],
    },
    markers: [
      { label: "1. The Problem (Rani di Dapur)", time: 0 },
      { label: "2. The Realization (Ide & Pilah)", time: 14.2 },
      { label: "3. The Solution (Regrow & Kompos)", time: 24.5 },
      { label: "4. Growing Process (Siram Kebun)", time: 36.2 },
      { label: "5. The Harvest (Panen Segar)", time: 46.6 },
      { label: "6. Back to Kitchen & Follow", time: 57.0 },
    ],
  },

  spicyBody: {
    scene: "spicyBody",
    title: "Reaksi Tubuh Saat Makan Pedas (47s)",
    duration: 47,
    outputPath: "output/reaksi-tubuh-makan-pedas.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-spicy.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-flame.wav",
          start: 6.2,
          end: 9.5,
          volume: 0.42,
        },
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 16.0,
          end: 17.6,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 25.0,
          end: 30.2,
          volume: 0.32,
        },
        { file: "assets/audio/sfx-safe.wav", start: 38.4, volume: 0.48 },
      ],
    },
    markers: [
      { label: "1. Hook: Pedas Bukan Rasa!", time: 0 },
      { label: "2. Tenggorokan Panas (TRPV1)", time: 6.5 },
      { label: "3. Otak Panik & Keringat", time: 16.0 },
      { label: "4. Mata Berair & Meler", time: 25.0 },
      { label: "5. Solusi Susu & Follow", time: 33.4 },
    ],
  },

  fetusBreathe: {
    scene: "fetusBreathe",
    title: "Bagaimana Janin Bernafas? (46s)",
    duration: 46,
    outputPath: "output/bagaimana-janin-bernafas.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-fetus.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.11,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-heartbeat.wav",
          start: 0.2,
          end: 8.0,
          volume: 0.42,
        },
        {
          file: "assets/audio/sfx-heartbeat.wav",
          start: 26.0,
          end: 33.4,
          volume: 0.46,
        },
        { file: "assets/audio/sfx-safe.wav", start: 34.0, volume: 0.44 },
      ],
    },
    markers: [
      { label: "1. Hook: Terendam 9 Bulan", time: 0 },
      { label: "2. Paru-Paru Ibu (O2)", time: 9.8 },
      { label: "3. Plasenta: Difusi O2/CO2", time: 13.6 },
      { label: "4. Tali Pusat -> Jantung", time: 26.0 },
      { label: "5. Napas Pertama & Follow", time: 33.6 },
    ],
  },

  waterJourney: {
    scene: "waterJourney",
    title: "Perjalanan Air PDAM & Tanah (59s)",
    duration: 59,
    outputPath: "output/perjalanan-air-ke-rumah.mp4",
    // Langit siang cerah -> pakai watermark versi gelap agar tajam
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
        file: "assets/audio/voiceover-water.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 0.2,
          end: 7.4,
          volume: 0.36,
        },
        {
          file: "assets/audio/sfx-water-flow.wav",
          start: 8.0,
          end: 16.0,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-bubbles.wav",
          start: 24.0,
          end: 27.8,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-water-flow.wav",
          start: 33.0,
          end: 40.8,
          volume: 0.34,
        },
        {
          file: "assets/audio/sfx-water-tap.wav",
          start: 48.0,
          end: 55.2,
          volume: 0.38,
        },
        { file: "assets/audio/sfx-safe.wav", start: 55.6, volume: 0.38 },
      ],
    },
    markers: [
      { label: "1. Hook: PDAM vs Air Tanah", time: 0 },
      { label: "2. PDAM: Sungai & Intake", time: 8.0 },
      { label: "3. PDAM: IPA Koagulasi-Filtrasi", time: 15.5 },
      { label: "4. PDAM: Kaporit & Menara Air", time: 24.0 },
      { label: "5. Air Tanah: Akuifer & Sumur Bor", time: 32.8 },
      { label: "6. Pompa -> Toren & Masak Dulu", time: 40.9 },
    ],
  },

  engineWarmup: {
    scene: "engineWarmup",
    title: "Panasin Mesin Lama Tiap Pagi? (41s)",
    duration: 41,
    outputPath: "output/panasin-mesin-tiap-pagi.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-warmup.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-engine-smooth.wav",
          start: 0.8,
          end: 15.3,
          volume: 0.32,
        },
        {
          file: "assets/audio/sfx-engine-rev.wav",
          start: 15.6,
          end: 22.3,
          volume: 0.44,
        },
        {
          file: "assets/audio/sfx-engine-smooth.wav",
          start: 22.6,
          end: 29.5,
          volume: 0.3,
        },
        { file: "assets/audio/sfx-safe.wav", start: 30.0, volume: 0.42 },
      ],
    },
    markers: [
      { label: "1. Pagi di Carport (10 Menit)", time: 0 },
      { label: "2. Zoom Mesin: Oli Naik 30 Detik", time: 6.6 },
      { label: "3. Bahaya Digeber (Baret)", time: 15.6 },
      { label: "4. Idle Lama: Boros & Kerak", time: 22.6 },
      { label: "5. Jalan Santai Pagi & Follow", time: 29.7 },
    ],
  },

  fuelMix: {
    scene: "fuelMix",
    title: "Campur Pertamax & Pertalite (56s)",
    duration: 56,
    outputPath: "output/campur-pertamax-pertalite.mp4",
    audio: {
      voiceover: {
        file: "assets/audio/voiceover-fuel-mix.mp3",
        start: 0,
        volume: 1.0,
      },
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.12,
        loop: true,
      },
      sfx: [
        {
          file: "assets/audio/sfx-fuel-pour.wav",
          start: 4.5,
          end: 13.5,
          volume: 0.42,
        },
        {
          file: "assets/audio/sfx-engine-smooth.wav",
          start: 23.8,
          end: 32.8,
          volume: 0.38,
        },
        {
          file: "assets/audio/sfx-engine-knock.wav",
          start: 33.0,
          end: 44.8,
          volume: 0.46,
        },
        { file: "assets/audio/sfx-safe.wav", start: 45.2, volume: 0.42 },
      ],
    },
    markers: [
      { label: "1. Adegan SPBU: Pesan Oplos", time: 0 },
      { label: "2. Zoom Tangki ≈ RON 91", time: 8.9 },
      { label: "3. Aliran Pump & Injektor", time: 17.4 },
      { label: "4. Mesin 4-Tak Normal", time: 24.1 },
      { label: "5. Knocking & Kerak Karbon", time: 32.9 },
      { label: "6. Pulang Senja & Follow", time: 45.1 },
    ],
  },

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
        {
          file: "assets/audio/sfx-clock.wav",
          start: 0.2,
          end: 5.5,
          volume: 0.42,
        },
        { file: "assets/audio/sfx-pop-equal.wav", start: 10.6, volume: 0.5 },
        {
          file: "assets/audio/sfx-reflux.wav",
          start: 25.5,
          end: 29.8,
          volume: 0.46,
        },
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
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 0.02,
          end: 1.7,
          volume: 0.42,
        },
        { file: "assets/audio/sfx-plug.wav", start: 1.6, volume: 0.48 },
        {
          file: "assets/audio/sfx-heat.wav",
          start: 7.9,
          end: 12.5,
          volume: 0.42,
        },
        {
          file: "assets/audio/sfx-spark.wav",
          start: 15.2,
          end: 22.0,
          volume: 0.5,
        },
        {
          file: "assets/audio/sfx-alarm.wav",
          start: 18.0,
          end: 19.6,
          volume: 0.32,
        },
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
        {
          file: "assets/audio/sfx-dig.wav",
          start: 0.1,
          end: 2.5,
          volume: 0.45,
        },
        {
          file: "assets/audio/sfx-drop.wav",
          start: 2.4,
          end: 5.5,
          volume: 0.5,
        },
        {
          file: "assets/audio/sfx-rain.wav",
          start: 5.7,
          end: 9.2,
          volume: 0.35,
        },
        {
          file: "assets/audio/sfx-bubbles.wav",
          start: 10.8,
          end: 13.4,
          volume: 0.45,
        },
        {
          file: "assets/audio/sfx-flame.wav",
          start: 15.2,
          end: 17.8,
          volume: 0.55,
        },
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

  demo3d: {
    scene: "demo3d",
    title: "Demo Bentuk 3D (10s)",
    duration: 10,
    outputPath: "output/demo-3d.mp4",
    audio: {
      bgm: {
        file: "assets/audio/bgm.wav",
        start: 0,
        volume: 0.2,
        loop: true,
      },
    },
    markers: [{ label: "1. Showcase 3D", time: 0 }],
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
