import { drawSubtitles } from './engine/subtitle.js';
import { drawWatermark } from './engine/watermark.js';
import { drawChargePillowScene } from './scenes/chargePillow.js';
import { CHARGE_PILLOW_SUBTITLES } from './scenes/chargePillowSubtitles.js';
import { drawBiogasDemo } from './scenes/demoBiogas.js';
import { drawLateDinnerScene } from './scenes/lateDinner.js';
import { LATE_DINNER_SUBTITLES } from './scenes/lateDinnerSubtitles.js';
import { DEMO_SUBTITLES } from './scenes/subtitles.js';

const SCENES = {
  lateDinner: {
    draw: drawLateDinnerScene,
    subtitles: LATE_DINNER_SUBTITLES,
  },
  chargePillow: {
    draw: drawChargePillowScene,
    subtitles: CHARGE_PILLOW_SUBTITLES,
  },
  biogas: {
    draw: drawBiogasDemo,
    subtitles: DEMO_SUBTITLES,
  },
};

/**
 * Entry point tunggal untuk merender 1 frame pada waktu `time` (detik).
 * Scene aktif dipilih dari `config.scene` di config.js.
 */
export function renderFrame(ctx, time, config) {
  const { width, height } = config;
  const active = SCENES[config.scene] || SCENES.lateDinner;

  ctx.clearRect(0, 0, width, height);

  // 1. Render animasi scene aktif
  active.draw(ctx, time, width, height);

  // 2. Render watermark logo (aktif otomatis di semua video)
  drawWatermark(ctx, config);

  // 3. Render subtitle karaoke di atas scene
  drawSubtitles(ctx, active.subtitles, time, width, height);
}
