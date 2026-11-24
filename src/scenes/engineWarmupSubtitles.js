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
 * Subtitle karaoke word-for-word tersinkron persis dengan assets/audio/voiceover-warmup.mp3 (41 detik).
 */
export const ENGINE_WARMUP_SUBTITLES = [
  cue(0.05, 3.1, "Masih suka manasin mesin sampai 10 menit tiap pagi?"),
  cue(3.3, 6.2, "Sebenarnya itu perlu atau malah buang-buang bensin?"),
  cue(6.6, 10.1, "Tujuan manasin mesin cuma satu: biar oli naik dari bawah"),
  cue(10.2, 12.6, "dan melumasi piston serta dinding silinder,"),
  cue(12.7, 15.2, "dan itu cuma butuh sekitar 30 detik!"),
  cue(
    15.6,
    19.0,
    "Yang bahaya justru kalau mesin baru nyala langsung digeber!",
  ),
  cue(19.1, 22.3, "Oli belum merata bisa bikin dinding silinder cepat baret."),
  cue(22.7, 25.6, "Sementara idle terlalu lama bikin bensin habis di tempat,"),
  cue(25.7, 29.0, "kerak karbon menumpuk, dan mesin panas tanpa angin jalan."),
  cue(
    29.8,
    33.6,
    "Untuk motor dan mobil injeksi modern, cukup 30 sampai 60 detik,",
  ),
  cue(33.7, 36.9, "lalu langsung jalan santai biar suhu mesin naik alami!"),
  cue(37.2, 39.6, "Follow untuk fakta menarik lainnya!"),
];
