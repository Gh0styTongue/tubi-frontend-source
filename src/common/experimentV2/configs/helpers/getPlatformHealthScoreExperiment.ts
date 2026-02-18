import type { ExperimentDescriptor } from '../types';
import { webottComcastSkipAdWithHealthscoreR3 } from '../webottComcastSkipAdWithHealthscoreR3';
import { webottCoxSkipAdWithHealthscoreR3 } from '../webottCoxSkipAdWithHealthscoreR3';
import { webottFiretvSkipAdWithHealthscoreR3 } from '../webottFiretvSkipAdWithHealthscoreR3';
import { webottLgtvSkipAdWithHealthscoreR3 } from '../webottLgtvSkipAdWithHealthscoreR3';
import { webottRogersSkipAdWithHealthscoreR3 } from '../webottRogersSkipAdWithHealthscoreR3';
import { webottShawSkipAdWithHealthscoreR3 } from '../webottShawSkipAdWithHealthscoreR3';
import { webottVizioSkipAdWithHealthscoreR3 } from '../webottVizioSkipAdWithHealthscoreR3';

type HealthScoreExperimentDescriptor = ExperimentDescriptor<{
  healthscore_skip_threshold: number;
}>;

const PLATFORM_EXPERIMENT_MAP: Partial<Record<OTTPLATFORM, HealthScoreExperimentDescriptor>> = {
  FIRETV_HYB: webottFiretvSkipAdWithHealthscoreR3,
  VIZIO: webottVizioSkipAdWithHealthscoreR3,
  LGTV: webottLgtvSkipAdWithHealthscoreR3,
  COX: webottCoxSkipAdWithHealthscoreR3,
  SHAW: webottShawSkipAdWithHealthscoreR3,
  COMCAST: webottComcastSkipAdWithHealthscoreR3,
  ROGERS: webottRogersSkipAdWithHealthscoreR3,
};

export function getPlatformHealthScoreExperiment(
  platform: OTTPLATFORM
): HealthScoreExperimentDescriptor | undefined {
  return PLATFORM_EXPERIMENT_MAP[platform];
}

