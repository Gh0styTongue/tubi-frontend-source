import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webLastVideoResourceRetry: 'titan_hlsv3_drm_fallback_web_2';
  }
}

TubiExperiments.webLastVideoResourceRetry = 'titan_hlsv3_drm_fallback_web_2';

export const WEB_LAST_VIDEO_RESOURCE_RETRY = {
  namespace: 'titan_hlsv3_drm_fallback_web_2',
  parameter: 'fallback_to',
};

export enum WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES {
  CONTROL = '',
  TREATMENT = 'hdcp_disabled',
}

export type TreatmentName = 'control' | 'hdcp_disabled';

export type TreatmentValue = WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES.CONTROL | WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES.TREATMENT;

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...WEB_LAST_VIDEO_RESOURCE_RETRY,
    id: TubiExperiments.webLastVideoResourceRetry,
    experimentName: 'titan_hlsv3_drm_fallback_web_2',
    defaultValue: WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES.CONTROL,
    treatments: [
      { name: 'control', value: WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES.CONTROL },
      { name: 'hdcp_disabled', value: WEB_LAST_VIDEO_RESOURCE_RETRY_VALUES.TREATMENT },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
