import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type { StoreState } from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungSynchronousVerification: 'OTT Samsung Synchronous Verification';
  }
}

TubiExperiments.ottSamsungSynchronousVerification = 'OTT Samsung Synchronous Verification';

export const OTT_SAMSUNG_SYNCHRONOUS_VERIFICATION_EXPERIMENT = {
  namespace: 'webott_samsung_synchronous_verification',
  parameter: 'verification',
};

export const getOTTSamsungSynchronousVerificationConfig = () => {
  return {
    ...OTT_SAMSUNG_SYNCHRONOUS_VERIFICATION_EXPERIMENT,
    id: TubiExperiments.ottSamsungSynchronousVerification,
    experimentName: 'webott_samsung_synchronous_verification',
    defaultValue: 'none' as const,
    treatments: [
      { name: 'control', value: 'none' } as const,
      { name: 'registration_link', value: 'registration_link' } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
  };
};

const OTTSamsungSynchronousVerification = (store?: Store<StoreState>) =>
  ExperimentManager(store).registerExperiment(getOTTSamsungSynchronousVerificationConfig());

export default OTTSamsungSynchronousVerification;
