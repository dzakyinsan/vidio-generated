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
 * Subtitle karaoke sinkron presisi dengan voiceover-asphalt-pothole.mp3 (60.29 detik -> 61s).
 */
export const ASPHALT_POTHOLE_SUBTITLES = [
  // Babak 1 — Jalan Baru Mulus (0.0 - 10.2s)
  cue(0.0, 3.3, "Kalau jalan baru selesai diaspal, awalnya memang mulus."),
  cue(3.4, 6.2, "Mobil melintas terasa sangat nyaman."),
  cue(
    6.3,
    10.2,
    "Tapi kenapa begitu musim hujan, baru sebentar udah bolong lagi?",
  ),
  // Babak 2 — Macro Zoom Retakan & Air Meresap (10.3 - 28.9s)
  cue(10.3, 13.0, "Masalahnya bukan cuma di permukaan aspal."),
  cue(
    13.1,
    17.6,
    "Begitu muncul retakan rambut kecil, air hujan pelan-pelan menyusup ke dalam.",
  ),
  cue(17.7, 19.3, "Dia tidak buru-buru..."),
  cue(19.4, 21.1, "tapi dia sabar."),
  cue(
    21.2,
    25.0,
    "Air meresap ke lapisan batu pondasi, melunakkan tanah di bawahnya,",
  ),
  cue(25.1, 28.9, "lalu menggerus pasir hingga terbentuk rongga kosong!"),
  // Babak 3 — Truk Berat Lewat -> KRAK! Lubang (29.0 - 37.9s)
  cue(29.0, 31.8, "Lalu truk berat lewat menekan titik lemah itu."),
  cue(31.9, 33.4, "Krak! Aspal kehilangan tumpuan,"),
  cue(
    33.5,
    37.9,
    "ambles ke bawah dan langsung jadi lubang penuh genangan air!",
  ),
  // Babak 4 — Solusi Teknis & Uji Hujan (38.0 - 60.3s)
  cue(38.0, 41.2, "Solusinya, jangan cuma ditambal tipis di permukaan."),
  cue(41.3, 45.0, "Pondasi batu di bawah harus dipadatkan ulang sampai kokoh."),
  cue(
    45.1,
    49.2,
    "Pasang drainase di tepi jalan, plus lapisan tack coat dan aspal kedap air.",
  ),
  cue(
    49.3,
    53.6,
    "Air hujan langsung mengalir lancar ke saluran, pondasi tetap kering,",
  ),
  cue(
    53.7,
    57.6,
    "dan jalan jauh lebih awet meski hujan deras dan truk berat terus lewat!",
  ),
  cue(57.7, 60.3, "Follow untuk fakta teknik menarik lainnya!"),
];
