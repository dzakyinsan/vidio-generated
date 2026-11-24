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
 * Subtitle karaoke word-for-word tersinkron persis dengan assets/audio/voiceover-fetus.mp3 (46 detik).
 */
export const FETUS_BREATHE_SUBTITLES = [
  cue(0.05, 3.2, 'Janin terendam cairan ketuban selama 9 bulan,'),
  cue(3.3, 5.3, 'tapi kenapa dia tidak tenggelam?'),
  cue(5.5, 9.7, 'Karena di dalam rahim, paru-paru janin belum dipakai menghirup udara.'),
  cue(9.8, 13.3, 'Oksigennya justru datang dari setiap tarikan napas sang ibu.'),
  cue(13.6, 18.2, 'Oksigen mengalir lewat darah ibu menuju organ ajaib bernama plasenta.'),
  cue(18.4, 21.7, 'Uniknya, darah ibu dan janin tidak pernah bercampur,'),
  cue(21.8, 25.7, 'oksigen dan karbon dioksida hanya bertukar lewat membran tipis.'),
  cue(26.0, 29.8, 'Lalu oksigen mengalir lewat tali pusat layaknya selang kehidupan,'),
  cue(30.0, 33.3, 'langsung menuju jantung janin yang berdetak di dalam rahim.'),
  cue(33.6, 36.2, 'Begitu bayi lahir dan tali pusat dipotong,'),
  cue(36.3, 39.2, 'paru-parunya mengembang untuk pertama kali menghirup udara bebas.'),
  cue(39.4, 42.2, 'Itulah alasan munculnya tangisan pertama!'),
  cue(42.4, 44.9, 'Follow untuk fakta menarik lainnya!'),
];
