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
 * Subtitle karaoke sinkron presisi dengan voiceover-javan-rhino.mp3 (91.17 detik -> 92s).
 */
export const JAVAN_RHINO_SUBTITLES = [
  // Adegan 1 — Viral di Medsos (0.0 - 6.0s)
  cue(0.0, 6.0, "Wacana pemindahan Badak Jawa dari Ujung Kulon mendadak viral dan memicu pro-kontra di media sosial."),
  // Adegan 2 — Induk & Anak Badak di Ujung Kulon (6.2 - 16.4s)
  cue(6.2, 11.2, "Saat ini, seluruh populasi Badak Jawa di dunia hanya tersisa puluhan ekor,"),
  cue(11.3, 16.4, "dan semuanya hidup di satu tempat saja, yaitu Taman Nasional Ujung Kulon."),
  // Adegan 3 — Peta Pulau Jawa: Ujung Kulon -> Alas Purwo (16.5 - 25.4s)
  cue(16.5, 21.4, "Pemerintah mengusulkan memindahkan sebagian badak sejauh hampir 1.000 kilometer"),
  cue(21.5, 25.4, "ke Taman Nasional Alas Purwo di Jawa Timur sebagai habitat kedua."),
  // Adegan 4 — Anak Krakatau & Tsunami (25.5 - 37.6s)
  cue(25.5, 31.2, "Alasannya mitigasi bencana, karena Ujung Kulon sangat dekat dengan Gunung Anak Krakatau."),
  cue(31.3, 37.6, "Jika letusan besar atau tsunami terjadi, seluruh populasi di satu titik terancam punah sekaligus."),
  // Adegan 5 — Penolakan Warga/Aktivis & Risiko Stres (37.8 - 52.8s)
  cue(37.8, 44.2, "Namun, rencana ini langsung menuai penolakan dari aktivis lingkungan, pakar ekologi, dan warga lokal."),
  cue(44.3, 47.8, "Pakar mengingatkan bahwa Badak Jawa sangat sensitif."),
  cue(47.9, 52.8, "Proses penangkapan dan perjalanan panjang punya risiko stres berat hingga kematian."),
  // Adegan 6 — Peta Tambang Banten & Kecurigaan WALHI (53.0 - 65.8s)
  cue(53.0, 58.6, "Selain itu, wacana ini muncul berdekatan dengan terbitnya peta wilayah pertambangan di Banten."),
  cue(58.7, 65.8, "Hal ini membuat organisasi lingkungan seperti WALHI dan publik curiga ada kepentingan tambang di balik relokasi."),
  // Adegan 7 — Klarifikasi Resmi ESDM & Kehutanan (66.0 - 81.8s)
  cue(66.0, 71.0, "Menanggapi hal itu, Kementerian ESDM dan Kementerian Kehutanan membantah keras,"),
  cue(71.1, 76.6, "serta menegaskan bahwa Ujung Kulon bukan wilayah tambang dan tidak ada izin tambang di dalamnya."),
  cue(76.7, 81.8, "Pemerintah juga menyebut pemindahan tidak akan dilakukan tanpa kajian ilmiah yang matang."),
  // Penutup — 2 Opsi Diskusi & Follow (82.0 - 91.2s)
  cue(82.0, 88.2, "Menurutmu, mana yang lebih tepat: memperkuat perlindungan di Ujung Kulon, atau tetap membuka habitat kedua?"),
  cue(88.3, 91.2, "Tulis pendapatmu di komentar dan follow!"),
];
