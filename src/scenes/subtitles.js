/**
 * Helper praktis untuk membagi kalimat menjadi kata-kata dengan timing merata
 * di antara [start, end].
 */
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

// Timing disinkronkan dengan assets/audio/voiceover.mp3
export const DEMO_SUBTITLES = [
  cue(0.05, 2.4, 'Kalau kamu gali lubang di halaman rumah,'),
  cue(2.5, 5.65, 'terus buang sisa dapur kayak kulit buah dan sayuran.'),
  cue(5.8, 8.95, 'Pas musim hujan, lubangnya banjir dan bau busuk.'),
  cue(9.1, 13.2, 'Jadi tanam tangki tertutup supaya bakteri ngeluarin gas metana.'),
  cue(13.4, 17.2, 'Sambung pipa ke kompor, dan apinya nyala biru buat masak.'),
  cue(17.4, 21.3, 'Selamat! Kamu udah punya instalasi biogas sendiri.'),
];
