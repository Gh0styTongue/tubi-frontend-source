import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { hlsNotEnabledVersions } from 'common/selectors/tizen';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungSkipBufferHoleInAdvance: 'webott_samsung_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottSamsungSkipBufferHoleInAdvance = 'webott_samsung_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const SAMSUNG_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_samsung_rebuffering_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...SAMSUNG_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottSamsungSkipBufferHoleInAdvance,
    experimentName: 'webott_samsung_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      try {
        for (const notEnabledVersion of hlsNotEnabledVersions) {
          if (window.navigator.userAgent.indexOf(`Tizen ${notEnabledVersion}`) !== -1) {
            return false;
          }
        }
      } catch {
        return false;
      }
      return true;
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
