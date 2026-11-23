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
 * Subtitle karaoke tersinkron dengan assets/audio/voiceover-charge.mp3 (28 detik).
 */
export const CHARGE_PILLOW_SUBTITLES = [
  cue(0.05, 3.6, 'Pernah ngecas HP sambil ditaruh di kasur atau bawah bantal?'),
  cue(3.8, 7.6, 'Saat diisi daya, baterai HP pasti menghasilkan panas alami.'),
  cue(7.9, 12.4, 'Masalahnya, bantal dan kasur itu isolator yang memerangkap panas.'),
  cue(12.7, 17.7, 'Suhu terus naik hingga separator baterai meleleh dan memicu thermal runaway.'),
  cue(18.0, 22.2, 'Baterai bisa berasap, terbakar, dan langsung menyambar kain kasur.'),
  cue(22.6, 27.4, 'Selalu cas HP di meja datar terbuka supaya panasnya cepat terbuang!'),
  cue(27.6, 30.3, 'Follow untuk fakta menarik lainnya!'),
];
