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
 * Subtitle karaoke sinkron presisi dengan voiceover-ant-mystery.mp3 (68.75 detik -> 69s).
 */
export const ANT_MYSTERY_SUBTITLES = [
  // Babak 1 — Masalah (0.0 - 13.7s)
  cue(
    0.0,
    4.7,
    "Baru taruh makanan di rak tinggi dan ditutup rapat, awalnya kelihatan aman.",
  ),
  cue(4.8, 8.0, "Tapi nggak lama, kok tiba-tiba dikerubungi semut?"),
  cue(
    8.1,
    13.7,
    "Sebenarnya, semut pengintai mereka sudah berpatroli 24 jam di seluruh rumahmu!",
  ),
  // Babak 2A — Macro Celah 1mm & Kaki Lengket (13.8 - 26.8s)
  cue(
    13.8,
    18.0,
    "Tutup toples yang terasa rapat sering masih menyisakan celah 1 milimeter.",
  ),
  cue(
    18.1,
    21.8,
    "Antena super sensitif semut langsung mencium aroma manisnya.",
  ),
  cue(
    21.9,
    26.8,
    "Dengan kaki lengket khusus, ia bisa memanjat kaca dengan mudah lalu menyusup masuk!",
  ),
  // Babak 2B — Jejak Feromon (26.9 - 39.8s)
  cue(
    26.9,
    32.5,
    "Setelah menemukan makanan, ia berjalan pulang sambil meneteskan jejak kimia bernama feromon.",
  ),
  cue(
    32.6,
    36.8,
    "Jejak ini berubah menjadi jalan tol GPS bagi pasukan semut lainnya.",
  ),
  cue(36.9, 39.8, "Makin banyak yang lewat, makin kuat aromanya!"),
  // Babak 3 — Dampak (39.9 - 47.9s)
  cue(39.9, 43.4, "Makanya dalam hitungan menit, toples langsung penuh semut."),
  cue(
    43.5,
    47.9,
    "Jadi mereka bukan teleportasi, melainkan mengikuti jejak feromon.",
  ),
  // Babak 4 — Solusi & Penutup (48.0 - 68.7s)
  cue(
    48.0,
    53.0,
    "Solusinya gampang! Pertama, lap jalur semut memakai air sabun atau cuka.",
  ),
  cue(
    53.1,
    58.0,
    "Ini langsung menghapus jejak feromon sehingga semut kehilangan arah dan balik kanan.",
  ),
  cue(
    58.1,
    62.2,
    "Kedua, simpan makanan di wadah dengan seal karet kedap udara.",
  ),
  cue(
    62.3,
    66.0,
    "Tanpa celah dan tanpa bocor aroma, dapurmu aman bebas semut!",
  ),
  cue(66.1, 68.7, "Follow untuk fakta sains menarik lainnya!"),
];
