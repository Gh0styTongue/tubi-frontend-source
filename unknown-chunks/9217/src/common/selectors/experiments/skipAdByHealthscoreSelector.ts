/* istanbul ignore file */
import type { AD_HEALTH_OPTIONS } from '@adrise/player/lib';

import type { COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottComcastSkipAdWithHealthscore';
import { getConfig as ComcastConfig } from 'common/experiments/config/ottComcastSkipAdWithHealthscore';
import type { FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottFireTVSkipAdWithHealthscore';
import { getConfig as FiretvConfig } from 'common/experiments/config/ottFireTVSkipAdWithHealthscore';
import type { LGTV_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottLGTVSkipAdWithHealthscore';
import { getConfig as LGTVConfig } from 'common/experiments/config/ottLGTVSkipAdWithHealthscore';
import type { PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottPs5SkipAdWithHealthscore';
import { getConfig as PS5Config } from 'common/experiments/config/ottPs5SkipAdWithHealthscore';
import type { VIZIO_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottVizioSkipAdWithHealthscore';
import { getConfig as VizioConfig } from 'common/experiments/config/ottVizioSkipAdWithHealthscore';
import type { XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/ottXboxoneSkipAdWithHealthscore';
import { getConfig as XboxoneConfig } from 'common/experiments/config/ottXboxoneSkipAdWithHealthscore';
import type { WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE } from 'common/experiments/config/webSkipAdWithHealthscore';
import { getConfig as WebConfig } from 'common/experiments/config/webSkipAdWithHealthscore';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';
type ExperimentValue = PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE | COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE | FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE | LGTV_SKIP_AD_WITH_HEALTHSCORE_VALUE | VIZIO_SKIP_AD_WITH_HEALTHSCORE_VALUE | XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE | WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE | AD_HEALTH_OPTIONS;

let config: ExperimentConfig<ExperimentValue, string> | undefined;

if (__WEBPLATFORM__ === 'WEB') {
  config = WebConfig();
} else if (__OTTPLATFORM__ === 'FIRETV_HYB') {
  config = FiretvConfig();
} else if (__OTTPLATFORM__ === 'COMCAST') {
  config = ComcastConfig();
} else if (__OTTPLATFORM__ === 'VIZIO') {
  config = VizioConfig();
} else if (__OTTPLATFORM__ === 'LGTV') {
  config = LGTVConfig();
} else if (__OTTPLATFORM__ === 'XBOXONE') {
  config = XboxoneConfig();
} else if (__OTTPLATFORM__ === 'PS5') {
  config = PS5Config();
}

export const skipAdByHealthScoreExpName = config?.experimentName ?? 'unknown';

export const skipAdWithHealthScoreSelector = (state: StoreState): ExperimentValue => {
  if (!config) return 'only_error' as ExperimentValue;

  const result = popperExperimentsSelector(state, {
    namespace: config.namespace,
    parameter: config.parameter,
    config,
  });
  return result;
};
