import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsBwwClientImpressions: 'webott_major_platforms_bww_client_impressions_v0';
  }
}

TubiExperiments.ottMajorPlatformsBwwClientImpressions = 'webott_major_platforms_bww_client_impressions_v0';

export const MAJOR_PLATFORMS_BWW_CLIENT_IMPRESSIONS = {
  namespace: 'webott_player_major_platforms_shared',
  parameter: 'send_impressions',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_BWW_CLIENT_IMPRESSIONS,
    id: TubiExperiments.ottMajorPlatformsBwwClientImpressions,
    experimentName: 'webott_major_platforms_bww_client_impressions_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_client_impressions', value: true } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
