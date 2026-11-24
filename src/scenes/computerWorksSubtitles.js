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
 * Subtitle karaoke sinkron presisi dengan voiceover-computer-works.mp3 (135.55 detik -> 136s).
 */
export const COMPUTER_WORKS_SUBTITLES = [
  // Opening — Hook GTA VI (0.0 - 13.8s)
  cue(0.0, 7.0, "Tahukah kamu bagaimana game seperti GTA VI bisa punya grafik super realistis dan kota yang hidup?"),
  cue(7.1, 13.8, "Di balik satu klik Play, ada jutaan bahkan miliaran proses kecil yang bekerja secepat kilat!"),
  // Fakta 1 — CPU (14.0 - 24.9s)
  cue(14.0, 19.5, "Pertama, CPU adalah otak komputer yang bertugas menjalankan instruksi dan perhitungan"),
  cue(19.6, 24.9, "untuk mengatur ratusan NPC, lalu lintas, hingga fisika di dalam kota GTA VI."),
  // Fakta 2 — RAM sementara (25.0 - 36.8s)
  cue(25.0, 30.8, "Kedua, begitu kamu masuk ke dalam game, peta dan tekstur dimuat dari SSD ke RAM."),
  cue(30.9, 36.8, "RAM berfungsi sebagai meja kerja sementara agar CPU bisa mengakses data game super cepat."),
  // Fakta 3 — RAM volatile (37.0 - 49.0s)
  cue(37.0, 41.1, "Ketiga, berbeda dari SSD, RAM bersifat volatile."),
  cue(41.2, 45.6, "Artinya, kalau listrik mendadak mati, semua data aktif di RAM langsung hilang!"),
  cue(45.7, 49.0, "Itulah kenapa progres game harus disimpan ke SSD."),
  // Fakta 4 — CPU Cache (49.1 - 60.5s)
  cue(49.1, 54.0, "Keempat, CPU punya memori khusus bernama Cache di dalam chip-nya."),
  cue(54.1, 60.5, "Data yang paling sering dipakai saat aksi seru disimpan di sini—jauh lebih kencang dari RAM!"),
  // Fakta 5 — Multi-Core (60.6 - 71.8s)
  cue(60.6, 65.8, "Kelima, prosesor modern punya banyak Core, seperti 8 Core dan 16 Thread."),
  cue(65.9, 71.8, "Jadi suara, fisika mobil, dan AI polisi bisa dikerjakan secara paralel bersamaan!"),
  // Fakta 6 — SSD vs RAM (72.0 - 84.8s)
  cue(72.0, 79.5, "Keenam, SSD menyimpan file game yang sangat besar secara permanen, sedangkan RAM menampung area aktif."),
  cue(79.6, 84.8, "Jadi meski SSD kamu besar, komputer tetap butuh RAM agar game berjalan mulus."),
  // Fakta 7 — GPU (85.0 - 99.5s)
  cue(85.0, 90.0, "Ketujuh, inilah bintang di balik grafik realistis GTA VI: GPU!"),
  cue(90.1, 99.5, "Selain merender cahaya, bayangan, dan efek air, GPU juga dipakai untuk video 3D, rendering, hingga AI."),
  // Fakta 8 — Motherboard (99.6 - 110.5s)
  cue(99.6, 103.5, "Kedelapan, semua komponen hebat ini tidak bekerja sendirian."),
  cue(103.6, 110.5, "Ada Motherboard yang menghubungkan CPU, RAM, SSD, dan GPU agar saling bertukar data setiap milidetik."),
  // Fakta 9 — Miliaran Siklus (110.6 - 120.8s)
  cue(110.6, 115.6, "Kesembilan, prosesor modern menjalankan miliaran siklus clock setiap detik!"),
  cue(115.7, 120.8, "Itulah rahasia kenapa puluhan frame per detik bisa tampil mulus tanpa patah-patah."),
  // Fakta 10 — OS Background + Closing (121.0 - 135.5s)
  cue(121.0, 127.0, "Kesepuluh, bahkan saat game sudah ditutup dan komputer terlihat diam, sistem operasi tetap sibuk—"),
  cue(127.1, 132.1, "mengelola memori, memeriksa perangkat, dan menjalankan berbagai layanan latar belakang."),
  cue(132.2, 135.5, "Follow untuk fakta teknologi menarik lainnya!"),
];
