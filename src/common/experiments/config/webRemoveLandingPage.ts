import { isSameDay } from '@adrise/utils/lib/time';
import { isMobileWebkit, isChromeOnAndroidMobile } from '@adrise/utils/lib/ua-sniffing';
import Cookie from 'react-cookie';
import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webRemoveLandingPage: 'Web Remove Landing Page';
  }
}

TubiExperiments.webRemoveLandingPage = 'Web Remove Landing Page';

export type TreatmentName = 'control' | 'no_landing_page';
export type TreatmentValue = 'landing_page' | 'no_landing_page';

export const IS_IN_WEB_REMOVE_LANDING_V4 = 'IS_IN_WEB_REMOVE_LANDING_V4';

export const getWebRemoveLandingPageExperimentConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    id: TubiExperiments.webRemoveLandingPage,
    namespace: 'webott_web_remove_landing_v4',
    experimentName: 'webott_web_remove_landing_v4',
    parameter: 'landing_page',
    defaultValue: 'landing_page' as const,
    treatments: [
      { name: 'control', value: 'landing_page' } as const,
      { name: 'no_landing_page', value: 'no_landing_page' } as const,
    ],
    enabledSelector: ({ ui: { isMobile, userAgent } }) => {
      const firstSeen: string | undefined = Cookie.load('firstSeen');

      return !isMobile
        && !isMobileWebkit(userAgent)
        && !isChromeOnAndroidMobile(userAgent)
        && __WEBPLATFORM__ === 'WEB'
        && (
          !firstSeen
          || isSameDay(new Date(firstSeen), new Date())
          || !!Cookie.load(IS_IN_WEB_REMOVE_LANDING_V4)
        );
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getWebRemoveLandingPageExperimentConfig());
