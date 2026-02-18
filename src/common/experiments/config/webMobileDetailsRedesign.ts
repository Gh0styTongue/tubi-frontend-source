import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webMobileDetailsRedesign: 'webott_web_mobile_details_redesign_v1';
  }
}

TubiExperiments.webMobileDetailsRedesign = 'webott_web_mobile_details_redesign_v1';

export enum WEB_MOBILE_DETAILS_REDESIGN_VALUE {
  CONTROL = 'none',
  PLAY_IN_APP_CTA = 'play_in_app',
  PLAY_CTA = 'play',
}

export const WEB_MOBILE_DETAILS_REDESIGN = {
  namespace: 'webott_web_mobile_details_redesign_v1',
  parameter: 'cta_text',
};

export const getConfig = () => {
  return {
    ...WEB_MOBILE_DETAILS_REDESIGN,
    id: TubiExperiments.webMobileDetailsRedesign,
    experimentName: 'webott_web_mobile_details_redesign_v1',
    defaultValue: WEB_MOBILE_DETAILS_REDESIGN_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: WEB_MOBILE_DETAILS_REDESIGN_VALUE.CONTROL } as const,
      { name: 'play_in_app_cta', value: WEB_MOBILE_DETAILS_REDESIGN_VALUE.PLAY_IN_APP_CTA } as const,
      { name: 'play_cta', value: WEB_MOBILE_DETAILS_REDESIGN_VALUE.PLAY_CTA } as const,
    ],
    enabledSelector: ({ ui: { isMobile } }: StoreState) => __WEBPLATFORM__ === 'WEB' && isMobile,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
