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
 * Subtitle super singkat & punchy (2-6 kata per layar, persis gaya video referensi)
 * "Kenapa Cat Tembok Menggelembung & Mengelupas?" (68 detik).
 */
export const WALL_PEELING_SUBTITLES = [
  // Babak 1 — Kondisi Awal (0.0 - 14.0s)
  cue(0.1, 2.8, "Kalau kamu cat tembok rumah,"),
  cue(3.0, 5.2, "awalnya memang aman."),
  cue(5.4, 8.6, "Tembok kelihatan rapi dan mulus."),
  cue(8.8, 13.6, "Tapi beberapa bulan kemudian, kenapa tiba-tiba ngelupas?"),
  // Babak 2 — Macro Zoom Penyebab Detail (14.0 - 34.0s)
  cue(14.2, 17.6, "Karena batu bata itu berpori."),
  cue(17.8, 21.8, "Di bawah pondasi, ada air tanah lembap."),
  cue(22.0, 25.4, "Air pelan-pelan merambat naik."),
  cue(25.6, 28.4, "Dia tidak buru-buru..."),
  cue(28.6, 30.8, "tapi dia sabar."),
  cue(31.0, 33.8, "Sambil membawa garam alkali dari semen."),
  // Babak 3 — Dampak Nyata (34.0 - 45.0s)
  cue(34.2, 38.0, "Air dan garam itu mendorong cat dari belakang."),
  cue(38.2, 41.4, "Cat mulai menggelembung..."),
  cue(41.6, 44.8, "lalu retak dan akhirnya mengelupas!"),
  // Babak 4 — Solusi Detail (45.0 - 68.0s)
  cue(45.2, 48.6, "Solusinya, jangan langsung ditimpa cat baru."),
  cue(48.8, 52.8, "Kerok dulu cat lama sampai bersih ke plester."),
  cue(53.0, 57.2, "Lapisi waterproofing kedap air dan alkali sealer."),
  cue(57.4, 60.2, "Lapisan ini memblokir air tanah dari dalam!"),
  cue(60.4, 63.8, "Baru dicat ulang — tembok tetap kering dan awet."),
  cue(64.1, 67.4, "Follow untuk fakta bangunan lainnya!"),
];
