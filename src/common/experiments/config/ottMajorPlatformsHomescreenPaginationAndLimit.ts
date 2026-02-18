import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsHomescreenPaginationAndLimit: 'webott_major_platforms_homescreen_pagination_and_limit_v2';
  }
}

TubiExperiments.ottMajorPlatformsHomescreenPaginationAndLimit =
  'webott_major_platforms_homescreen_pagination_and_limit_v2';

export const MAJOR_PLATFORMS_HOMESCREEN_PAGINATION_AND_LIMIT = {
  namespace: 'webott_major_platforms_homescreen_pagination_and_limit_v2',
  parameter: 'settings',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_HOMESCREEN_PAGINATION_AND_LIMIT,
    id: TubiExperiments.ottMajorPlatformsHomescreenPaginationAndLimit,
    experimentName: 'webott_major_platforms_homescreen_pagination_and_limit_v2',
    defaultValue: { groupSize: 5, limit: 9 },
    treatments: [
      { name: 'control', value: { groupSize: 5, limit: 9 } },
      { name: 'b', value: { groupSize: 3, limit: 9 } },
      { name: 'c', value: { groupSize: 7, limit: 9 } },
      { name: 'd', value: { groupSize: 5, limit: 7 } },
      { name: 'e', value: { groupSize: 5, limit: 12 } },
      { name: 'f', value: { groupSize: 3, limit: 7 } },
      { name: 'g', value: { groupSize: 7, limit: 12 } },
    ],
    enabledSelector: () =>
      ['ANDROIDTV', 'FIRETV_HYB', 'COMCAST', 'COX', 'HILTON', 'ROGERS', 'TIZEN', 'SHAW', 'VIZIO', 'LGTV'].includes(
        __OTTPLATFORM__
      ),
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
