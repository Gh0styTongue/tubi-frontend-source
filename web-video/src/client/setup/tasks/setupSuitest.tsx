import { parseQueryString } from '@adrise/utils/lib/queryString';

import { exposeToTubiGlobal } from 'client/global';
import ExperimentManager from 'common/experiments/ExperimentManager';
import ApiClient from 'common/helpers/ApiClient';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiStore } from 'common/types/storeState';

const isEnvReadyForAutomation = () => (!__PRODUCTION__ || __IS_ALPHA_ENV__) && __CLIENT__;

export function isInSuitest(): boolean {
  // we set up suitest when there is qa_suitest in the URL params
  // or window.suitest is not undefined for platforms that are not able to keep the URL params like Samsung
  const isEnabled = FeatureSwitchManager.isEnabled('Suitest')
  || window.location.search.includes('qaSuitest=true')
  || typeof window.suitest !== 'undefined';

  return isEnvReadyForAutomation() && isEnabled;
}

export const setupSuitest = (store: TubiStore) => {
  if (isInSuitest()) {
    const script = document.createElement('script');
    // OTT and web have different app id on Suitest, the URLs are copied from Suitest settings
    script.src = __ISOTT__
      ? 'https://the.suite.st/app/b367b48f-0f27-4758-a921-9cd4f64369a9.js'
      : 'https://the.suite.st/app/e69a0ecd-a922-445d-8b12-6ac3525aef60.js';
    document.body.appendChild(script);

    // enable Suitest with feature switch to keep it persistent
    FeatureSwitchManager.set('Suitest', FeatureSwitchManager.ENABLE_VALUE);
    // skip intro animtion in Suitest automation
    FeatureSwitchManager.set('IntroAnimation', FeatureSwitchManager.DISABLE_VALUE);

    // support to disable ads with URL params
    if (window.location.search.includes('noAds=1')) {
      FeatureSwitchManager.set(['Ad', 'Availability'], FeatureSwitchManager.DISABLE_VALUE);
    }

    const query = parseQueryString(location.search);
    if (query.disableAllExperiments === true) {
      ExperimentManager()
        .getExperiments()
        .forEach((exp) => {
          exp.enableOverride('control');
        });
    }

    if (query.disableAllExperiments === false) {
      ExperimentManager()
        .getExperiments()
        .forEach((exp) => {
          exp.disableOverride();
        });
    }

    const {
      auth: { deviceId },
    } = store.getState();
    const sendId = (udid: string) => {
      const client = new ApiClient();
      client.post('https://qa-proxy.staging-public.tubi.io/samsung/device/id', {
        data: {
          deviceId,
          udid,
        },
      });
    };
    exposeToTubiGlobal({ sendId });
  }
  /* istanbul ignore else */
  if (isEnvReadyForAutomation()) {
    /**
     * 1. assign the feature switch manager to `Tubi.FeatureSwitchManager` on the global scope
     *    so that we can use it with 'Execute command' operation on Suitest
     * 2. we assign FeatureSwitchManager to global on client(non-proudction) for web-ott-automation
     *    https://github.com/adRise/web-ott-automation
     **/
    exposeToTubiGlobal({ FeatureSwitchManager });
  }
};
