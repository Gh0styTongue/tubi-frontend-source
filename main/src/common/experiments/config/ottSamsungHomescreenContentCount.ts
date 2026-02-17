import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungHomescreenContentCount: 'webott_samsung_homescreen_content_count';
  }
}

TubiExperiments.ottSamsungHomescreenContentCount = 'webott_samsung_homescreen_content_count';

export enum SAMSUNG_HOMESCREEN_CONTENT_COUNT_VALUE {
  CONTROL = 9,
  WITH_12_CONTENTS = 12,
  WITH_15_CONTENTS = 15,
}

export const SAMSUNG_HOMESCREEN_CONTENT_COUNT = {
  namespace: 'webott_samsung_homescreen_content_count',
  parameter: 'count',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_HOMESCREEN_CONTENT_COUNT,
    id: TubiExperiments.ottSamsungHomescreenContentCount,
    experimentName: 'webott_samsung_homescreen_content_count',
    defaultValue: SAMSUNG_HOMESCREEN_CONTENT_COUNT_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: SAMSUNG_HOMESCREEN_CONTENT_COUNT_VALUE.CONTROL } as const,
      { name: 'with_12_contents', value: SAMSUNG_HOMESCREEN_CONTENT_COUNT_VALUE.WITH_12_CONTENTS } as const,
      { name: 'with_15_contents', value: SAMSUNG_HOMESCREEN_CONTENT_COUNT_VALUE.WITH_15_CONTENTS } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
