function cue(start, end, text) {
  const parts = text.trim().split(/\s+/);
  const step = (end - start) / parts.length;
  return {
    start,
    end,
    words: parts.map((w, idx) => ({
      text: w,
      start: start + idx * step,
      end: start + (idx + 1) * step,
    })),
  };
}

/**
 * Subtitle karaoke sinkron presisi dengan voiceover-food-loop.mp3 (69.56 detik -> 70s).
 */
export const FOOD_LOOP_SUBTITLES = [
  // Scene 1 — The Problem (0.0s - 14.0s)
  cue(0.0, 3.5, 'Kenalan sama Rani. Setiap kali selesai masak di dapur,'),
  cue(3.5, 8.9, 'kulit sayur, pangkal daun bawang, dan akar selada langsung ia buang ke tempat sampah.'),
  cue(9.0, 14.0, 'Kelihatannya sepele, tapi ternyata banyak banget bahan bagus yang terbuang percuma!'),
  // Scene 2 — The Realization (14.2s - 24.4s)
  cue(14.2, 19.8, 'Sampai suatu hari, Rani kepikiran: gimana kalau sisa dapur ini bisa jadi makanan lagi?'),
  cue(19.9, 24.4, 'Daripada dibuang semua, Rani mulai memilah sisa sayuran sesuai potensinya.'),
  // Scene 3 — The Solution (24.5s - 36.1s)
  cue(24.5, 30.2, 'Pangkal daun bawang, seledri, dan selada ia rendam di gelas air pakai metode regrowing.'),
  cue(30.3, 36.1, 'Sementara kulit buah dan sisa sayur lainnya Rani olah jadi kompos organik penyubur tanaman.'),
  // Scene 4 — The Growing Process (36.2s - 46.5s)
  cue(36.2, 42.6, 'Cukup pakai wadah sederhana, sedikit air, tanah, dan kompos buatannya sendiri, Rani rutin menyiramnya.'),
  cue(42.7, 46.5, 'Dan sisa dapur tadi pelan-pelan tumbuh jadi tanaman baru!'),
  // Scene 5 — The Harvest (46.6s - 56.9s)
  cue(46.6, 51.4, 'Setelah dirawat dengan telaten, akhirnya sayuran segar ini siap dipanen!'),
  cue(51.5, 56.9, 'Sampah dapurnya berkurang jauh, dan Rani dapat bahan makanan gratis dari rumah sendiri.'),
  // Scene 6 — Back to the Kitchen & Follow (57.0s - 69.5s)
  cue(57.0, 61.9, 'Sayur hasil panen langsung kembali ke dapur, dimasak hangat untuk keluarga tercinta.'),
  cue(62.0, 66.8, 'Siklusnya terus berputar dari dapur—lebih sedikit sampah, lebih banyak manfaat.'),
  cue(66.9, 69.5, 'Follow untuk fakta menarik lainnya!'),
];
