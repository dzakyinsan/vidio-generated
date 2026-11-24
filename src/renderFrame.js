import { drawSubtitles } from './engine/subtitle.js';
import { drawWatermark } from './engine/watermark.js';
import { drawAntMysteryScene } from './scenes/antMystery.js';
import { ANT_MYSTERY_SUBTITLES } from './scenes/antMysterySubtitles.js';
import { drawAsphaltPotholeScene } from './scenes/asphaltPothole.js';
import { ASPHALT_POTHOLE_SUBTITLES } from './scenes/asphaltPotholeSubtitles.js';
import { drawChargePillowScene } from './scenes/chargePillow.js';
import { CHARGE_PILLOW_SUBTITLES } from './scenes/chargePillowSubtitles.js';
import { drawComputerWorksScene } from './scenes/computerWorks.js';
import { COMPUTER_WORKS_SUBTITLES } from './scenes/computerWorksSubtitles.js';
import { drawDemo3DScene } from './scenes/demo3d.js';
import { drawBiogasDemo } from './scenes/demoBiogas.js';
import { drawEngineWarmupScene } from './scenes/engineWarmup.js';
import { ENGINE_WARMUP_SUBTITLES } from './scenes/engineWarmupSubtitles.js';
import { drawFetusBreatheScene } from './scenes/fetusBreathe.js';
import { FETUS_BREATHE_SUBTITLES } from './scenes/fetusBreatheSubtitles.js';
import { drawFoodLoopScene } from './scenes/foodLoop.js';
import { FOOD_LOOP_SUBTITLES } from './scenes/foodLoopSubtitles.js';
import { drawFuelMixEngineScene } from './scenes/fuelMixEngine.js';
import { FUEL_MIX_SUBTITLES } from './scenes/fuelMixEngineSubtitles.js';
import { drawJavanRhinoScene } from './scenes/javanRhino.js';
import { JAVAN_RHINO_SUBTITLES } from './scenes/javanRhinoSubtitles.js';
import { drawSpicyBodyScene } from './scenes/spicyBody.js';
import { SPICY_BODY_SUBTITLES } from './scenes/spicyBodySubtitles.js';
import { drawWallPeelingScene } from './scenes/wallPeeling.js';
import { WALL_PEELING_SUBTITLES } from './scenes/wallPeelingSubtitles.js';
import { drawWaterJourneyScene } from './scenes/waterJourney.js';
import { WATER_JOURNEY_SUBTITLES } from './scenes/waterJourneySubtitles.js';
import { drawLateDinnerScene } from './scenes/lateDinner.js';
import { LATE_DINNER_SUBTITLES } from './scenes/lateDinnerSubtitles.js';
import { DEMO_SUBTITLES } from './scenes/subtitles.js';

const SCENES = {
  antMystery: {
    draw: drawAntMysteryScene,
    subtitles: ANT_MYSTERY_SUBTITLES,
  },
  asphaltPothole: {
    draw: drawAsphaltPotholeScene,
    subtitles: ASPHALT_POTHOLE_SUBTITLES,
  },
  javanRhino: {
    draw: drawJavanRhinoScene,
    subtitles: JAVAN_RHINO_SUBTITLES,
  },
  wallPeeling: {
    draw: drawWallPeelingScene,
    subtitles: WALL_PEELING_SUBTITLES,
  },
  computerWorks: {
    draw: drawComputerWorksScene,
    subtitles: COMPUTER_WORKS_SUBTITLES,
  },
  foodLoop: {
    draw: drawFoodLoopScene,
    subtitles: FOOD_LOOP_SUBTITLES,
  },
  spicyBody: {
    draw: drawSpicyBodyScene,
    subtitles: SPICY_BODY_SUBTITLES,
  },
  fetusBreathe: {
    draw: drawFetusBreatheScene,
    subtitles: FETUS_BREATHE_SUBTITLES,
  },
  waterJourney: {
    draw: drawWaterJourneyScene,
    subtitles: WATER_JOURNEY_SUBTITLES,
  },
  engineWarmup: {
    draw: drawEngineWarmupScene,
    subtitles: ENGINE_WARMUP_SUBTITLES,
  },
  fuelMix: {
    draw: drawFuelMixEngineScene,
    subtitles: FUEL_MIX_SUBTITLES,
  },
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
  demo3d: {
    draw: drawDemo3DScene,
    subtitles: [],
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
