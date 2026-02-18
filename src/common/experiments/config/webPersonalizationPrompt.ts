import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let personalizationPrompt: 'webott_web_personalization_prompt';
  }
}

TubiExperiments.personalizationPrompt = 'webott_web_personalization_prompt';

export const WEB_PERSONALIZATION_PROMPT = {
  namespace: 'webott_web_personalization_prompt_v2',
  parameter: 'enabled',
};

export const getConfig = (): ExperimentConfig<boolean, string> => {
  return {
    ...WEB_PERSONALIZATION_PROMPT,
    id: TubiExperiments.personalizationPrompt,
    experimentName: 'webott_web_personalization_prompt_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: ({ ui: { isMobile, twoDigitCountryCode } }) => __WEBPLATFORM__ === 'WEB' && !isMobile && isFeatureAvailableInCountry('webPersonalization', twoDigitCountryCode),
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
