import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { hlsNotEnabledVersions } from 'common/selectors/tizen';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungDedicatedAdPlayer: 'webott_samsung_multiple_video_elements';
  }
}

TubiExperiments.ottSamsungDedicatedAdPlayer = 'webott_samsung_multiple_video_elements';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottSamsungDedicatedAdPlayer,
    namespace: 'webott_samsung_ad_optimization_with_multiple_video_elements',
    parameter: 'multiple_video_element',
    experimentName: 'webott_samsung_multiple_video_elements',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'multiple_video_element', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const notEnabledVersion of hlsNotEnabledVersions) {
          if (userAgent.indexOf(`Tizen ${notEnabledVersion}`) !== -1) {
            return false;
          }
        }
        return true;
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
