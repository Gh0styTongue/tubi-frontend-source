import type { Store } from 'redux';

import { PROGRESSIVE_MODE } from 'common/constants/experiments';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVProgressiveFetch: 'webott_firetv_progressive_fetch_v5';
  }
}

TubiExperiments.ottFireTVProgressiveFetch = 'webott_firetv_progressive_fetch_v5';

export const FIRETV_PROGRESSIVE_FETCH = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'progressive_mode_v5',
};

const defaultConfig = {
  progressive: false,
  progressiveAppendMp4: false,
  progressiveUseDetachedLoader: false,
  progressiveStartedUpSeekingEnable: false,
  progressiveFastSpeedEnable: false,
  progressiveFastSpeedFactor: 1,
};

export function getConfigDetailFromMode(progressiveMode: number) {
  switch (progressiveMode) {
    case PROGRESSIVE_MODE.CONTROL:
      return defaultConfig;
    case PROGRESSIVE_MODE.PROGRESSIVE_ANY_SPEED:
      return {
        progressive: true,
        progressiveAppendMp4: true,
        progressiveUseDetachedLoader: true,
        progressiveStartedUpSeekingEnable: true,
        progressiveFastSpeedEnable: false,
        progressiveFastSpeedFactor: 1,
      };
    case PROGRESSIVE_MODE.PROGRESSIVE_NORMAL_SPEED:
      return {
        progressive: true,
        progressiveAppendMp4: true,
        progressiveUseDetachedLoader: true,
        progressiveStartedUpSeekingEnable: true,
        progressiveFastSpeedEnable: true,
        progressiveFastSpeedFactor: 1,
      };
    case PROGRESSIVE_MODE.PROGRESSIVE_FAST_SPEED:
      return {
        progressive: true,
        progressiveAppendMp4: true,
        progressiveUseDetachedLoader: true,
        progressiveStartedUpSeekingEnable: true,
        progressiveFastSpeedEnable: true,
        progressiveFastSpeedFactor: 2,
      };
    default:
      break;
  }
  return defaultConfig;
}

export type TreatmentName = 'control' | 'progressive_any_speed' | 'progressive_normal_speed' | 'progressive_fast_speed';

export type TreatmentValue = PROGRESSIVE_MODE.CONTROL | PROGRESSIVE_MODE.PROGRESSIVE_ANY_SPEED | PROGRESSIVE_MODE.PROGRESSIVE_NORMAL_SPEED | PROGRESSIVE_MODE.PROGRESSIVE_FAST_SPEED;

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_PROGRESSIVE_FETCH,
    id: TubiExperiments.ottFireTVProgressiveFetch,
    experimentName: 'webott_firetv_progressive_fetch_v5',
    defaultValue: PROGRESSIVE_MODE.CONTROL,
    treatments: [
      { name: 'control', value: PROGRESSIVE_MODE.CONTROL },
      { name: 'progressive_any_speed', value: PROGRESSIVE_MODE.PROGRESSIVE_ANY_SPEED },
      { name: 'progressive_normal_speed', value: PROGRESSIVE_MODE.PROGRESSIVE_NORMAL_SPEED },
      { name: 'progressive_fast_speed', value: PROGRESSIVE_MODE.PROGRESSIVE_FAST_SPEED },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
