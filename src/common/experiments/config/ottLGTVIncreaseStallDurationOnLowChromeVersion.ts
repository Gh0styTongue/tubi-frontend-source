import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVIncreaseStallDurationOnLowChromeVersion: 'webott_lgtv_increase_stall_duration_on_low_chrome_version';
  }
}

TubiExperiments.ottLGTVIncreaseStallDurationOnLowChromeVersion =
  'webott_lgtv_increase_stall_duration_on_low_chrome_version';

export enum LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION_VALUE {
  CONTROL = 550,
  STALL_MINIMUM_DURATION_800 = 800,
  STALL_MINIMUM_DURATION_1000 = 1000,
}

export const LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION = {
  namespace: 'webott_lgtv_increase_stall_duration_on_low_chrome_version',
  parameter: 'stall_minimum_duration',
};
const MIN_CHROME_VERSION = 68;

const isLowChromeVersionOnLGTV = (userAgent: string) => {
  const chromeVersion = userAgent.match(/Chrome\/([0-9]+)/);
  if (chromeVersion) {
    return parseInt(chromeVersion[1], 10) < MIN_CHROME_VERSION;
  }
  return false;
};

export const getConfig = () => {
  return {
    ...LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION,
    id: TubiExperiments.ottLGTVIncreaseStallDurationOnLowChromeVersion,
    experimentName: 'webott_lgtv_increase_stall_duration_on_low_chrome_version',
    defaultValue: LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION_VALUE.CONTROL } as const,
      {
        name: 'stall_minimum_duration_800',
        value: LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION_VALUE.STALL_MINIMUM_DURATION_800,
      } as const,
      {
        name: 'stall_minimum_duration_1000',
        value: LGTV_INCREASE_STALL_DURATION_ON_LOW_CHROME_VERSION_VALUE.STALL_MINIMUM_DURATION_1000,
      } as const,
    ],
    enabledSelector: (state: StoreState) => {
      try {
        const userAgent = state.ui.userAgent.ua;
        if (isLowChromeVersionOnLGTV(userAgent) && __OTTPLATFORM__ === 'LGTV') {
          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
