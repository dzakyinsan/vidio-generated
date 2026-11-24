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
 * Subtitle karaoke word-for-word tersinkron persis dengan assets/audio/voiceover-water.mp3 (59 detik).
 */
export const WATER_JOURNEY_SUBTITLES = [
  cue(0.05, 4.5, 'Tahukah kamu? Air keran di rumah kita biasanya datang dari dua jalur rahasia:'),
  cue(4.7, 7.6, 'PDAM atau air tanah!'),
  cue(8.0, 11.6, 'Pertama, jalur PDAM. Air diambil dari sungai keruh,'),
  cue(11.7, 15.2, 'lalu disaring dari sampah dan disedot pompa intake.'),
  cue(15.5, 19.6, 'Di instalasi pengolahan, lumpur digumpalkan koagulan lalu diendapkan,'),
  cue(19.7, 23.7, 'dan disaring berlapis pasir silika serta karbon aktif hingga bening.'),
  cue(24.0, 27.8, 'Kuman dibasmi klorin — makanya kadang tercium bau kaporit —'),
  cue(28.0, 32.3, 'lalu gravitasi menara air mendorongnya lewat pipa bawah tanah ke rumahmu!'),
  cue(32.8, 36.6, 'Kedua, air tanah. Air hujan meresap dan tersaring alami'),
  cue(36.7, 40.6, 'oleh lapisan pasir dan batu hingga terkumpul di akuifer bawah rumah.'),
  cue(40.9, 44.8, 'Pompa sumur menyedotnya naik ke toren atas, lalu mengalir turun ke keran,'),
  cue(45.0, 47.7, 'tapi hati-hati jarak dengan septic tank!'),
  cue(48.0, 51.7, 'Mau PDAM yang lewat pipa tua, atau air sumur yang kaya mineral,'),
  cue(51.8, 55.5, 'keduanya tetap wajib dimasak atau difilter dulu sebelum diminum ya!'),
  cue(55.8, 58.3, 'Follow untuk fakta menarik lainnya!'),
];
