import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHEVCAnd480PAds: 'webott_firetv_hevc_and_480p_ads_v2';
  }
}

TubiExperiments.ottFireTVHEVCAnd480PAds = 'webott_firetv_hevc_and_480p_ads_v2';

export const FIRETV_HEVC_AND_480P_ADS = {
  namespace: 'webott_firetv_hevc_and_480p_ads_v2',
  parameter: 'video_type',
};

export const FIRETV_HEVC_AND_480P_ADS_VIDEO_TYPE = {
  CONTROL: 'control',
  AVC_480P: 'avc_480p',
  HEVC_480P: 'hevc_480p',
};

export const getConfig = () => {
  return {
    ...FIRETV_HEVC_AND_480P_ADS,
    id: TubiExperiments.ottFireTVHEVCAnd480PAds,
    experimentName: 'webott_firetv_hevc_and_480p_ads_v2',
    defaultValue: FIRETV_HEVC_AND_480P_ADS_VIDEO_TYPE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_HEVC_AND_480P_ADS_VIDEO_TYPE.CONTROL },
      { name: 'avc_480p', value: FIRETV_HEVC_AND_480P_ADS_VIDEO_TYPE.AVC_480P },
      { name: 'hevc_480p', value: FIRETV_HEVC_AND_480P_ADS_VIDEO_TYPE.HEVC_480P },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
