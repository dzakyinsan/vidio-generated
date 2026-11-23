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
 * Subtitle karaoke tersinkron dengan assets/audio/voiceover-late-dinner.mp3 (43 detik).
 */
export const LATE_DINNER_SUBTITLES = [
  cue(
    0.05,
    5.6,
    "Katanya makan di atas jam tujuh malam otomatis bikin gemuk. Mitos atau fakta?",
  ),
  cue(
    5.9,
    11.7,
    "Faktanya, lima ratus lima puluh kalori di jam enam sore atau sembilan malam itu sama saja.",
  ),
  cue(12.0, 14.8, "Kuncinya, total kalori harian."),
  cue(
    15.1,
    20.2,
    "Tapi, studi Harvard menemukan makan terlalu larut mengacaukan ritme sirkadian,",
  ),
  cue(20.3, 23.8, "bikin hormon lapar naik dan gampang surplus kalori."),
  cue(
    24.1,
    30.8,
    "Bahaya lainnya, kalau langsung rebahan, asam lambung mudah naik memicu GERD dan mengganggu kualitas tidur.",
  ),
  cue(
    31.1,
    39.0,
    "Jadi patokannya bukan jam tujuh, tapi beri jeda dua sampai tiga jam sebelum tidur dan jaga total kalori harianmu.",
  ),
  cue(39.3, 42.2, "Follow untuk fakta menarik lainnya!"),
];
