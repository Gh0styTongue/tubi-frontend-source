import type { Store } from 'redux';

import { DelayAdStartVariant } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDelayAdStartEvent: 'webott_firetv_delay_ad_start_event';
  }
}

TubiExperiments.ottFireTVDelayAdStartEvent = 'webott_firetv_delay_ad_start_event';

export const getConfig = () => {
  return {
    namespace: 'webott_firetv_delay_ad_start_event',
    parameter: 'variant',
    id: TubiExperiments.ottFireTVDelayAdStartEvent,
    experimentName: 'webott_firetv_delay_ad_start_event',
    defaultValue: DelayAdStartVariant.Control,
    inYoubora: true,
    treatments: [
      { name: 'control', value: DelayAdStartVariant.Control },
      { name: 'delay_ad_start', value: DelayAdStartVariant.Delay_ad_start },
      { name: 'load_between_ads', value: DelayAdStartVariant.Load_between_ads },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'FIRETV_HYB') {
        return false;
      }

      try {
        const userAgent = state.ui.userAgent.ua;
        return (/Chrome\/130/).test(userAgent);
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
