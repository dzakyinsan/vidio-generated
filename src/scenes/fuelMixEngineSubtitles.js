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
 * Subtitle karaoke word-for-word tersinkron persis dengan assets/audio/voiceover-fuel-mix.mp3 (56 detik).
 */
export const FUEL_MIX_SUBTITLES = [
  cue(0.05, 4.1, 'Pernah lihat orang isi bensin lalu minta dicampur Pertalite sama Pertamax?'),
  cue(4.3, 8.6, 'Aman atau malah diam-diam merusak mesin? Yuk kita intip ke dalam!'),
  cue(8.9, 13.7, 'Di dalam tangki, keduanya langsung menyatu jadi oktan sekitar 91,'),
  cue(13.9, 17.1, 'tapi aditif pembersih Pertamax ikut encer.'),
  cue(17.4, 20.4, 'Campuran ini lalu dipompa melewati filter'),
  cue(20.5, 23.6, 'dan disemprot injektor menjadi kabut halus ke ruang bakar.'),
  cue(24.0, 26.3, 'Normalnya, bensin sesuai kompresi'),
  cue(26.35, 28.9, 'baru terbakar tepat saat busi memercik,'),
  cue(29.0, 32.3, 'sehingga ledakan mendorong piston turun dengan mulus.'),
  cue(32.6, 36.1, 'Masalahnya, jika kompresi mesinmu tinggi lalu dioplos,'),
  cue(36.2, 39.1, 'bensin bisa meledak dini sebelum busi menyala.'),
  cue(39.4, 42.1, 'Akibatnya mesin ngelitik, piston terhentak,'),
  cue(42.2, 44.7, 'dan kerak karbon makin cepat menumpuk!'),
  cue(45.0, 48.2, 'Kalau darurat sekali-kali masih aman,'),
  cue(48.4, 52.6, 'tapi untuk harian sebaiknya konsisten satu jenis BBM sesuai kompresi mesin.'),
  cue(52.9, 55.4, 'Follow untuk fakta menarik lainnya!'),
];
