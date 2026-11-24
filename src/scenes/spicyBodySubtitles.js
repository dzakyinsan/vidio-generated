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
 * Subtitle karaoke word-for-word tersinkron persis dengan assets/audio/voiceover-spicy.mp3 (47 detik).
 */
export const SPICY_BODY_SUBTITLES = [
  cue(0.05, 3.2, "Tahukah kamu? Pedas itu sebenarnya bukan rasa,"),
  cue(3.3, 5.7, "tubuhmu cuma lagi ditipu oleh cabai!"),
  cue(
    5.9,
    11.2,
    "Saat kamu makan terlalu pedas, zat kapsaisin menempel di reseptor panas lidah dan tenggorokan.",
  ),
  cue(
    11.4,
    15.8,
    "Otak langsung menerima sinyal palsu seolah tenggorokanmu sedang terbakar api!",
  ),
  cue(
    16.0,
    21.2,
    "Karena panik mengira tubuh kepanasan, otak langsung menyalakan mode pendinginan darurat:",
  ),
  cue(
    21.3,
    25.1,
    "pembuluh darah wajah melebar jadi merah, dan keringat mengucur deras!",
  ),
  cue(
    25.3,
    29.8,
    "Saraf wajah juga ikut terpicu iritasi, memaksa tubuh masuk mode bilas —",
  ),
  cue(29.9, 33.3, "makanya matamu tiba-tiba berair dan hidung ikut meler!"),
  cue(
    33.5,
    38.2,
    "Nah, jangan minum air putih karena kapsaisin berbasis minyak dan malah menyebar.",
  ),
  cue(
    38.3,
    43.2,
    "Minumlah susu! Protein kasein di dalamnya langsung mengikat dan menyapu rasa panasnya.",
  ),
  cue(43.4, 45.9, "Follow untuk fakta menarik lainnya!"),
];
