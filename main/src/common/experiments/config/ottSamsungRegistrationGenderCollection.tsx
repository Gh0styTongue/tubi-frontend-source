import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type { StoreState } from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungRegistrationGenderCollection: 'OTT Fire TV Registration Gender Collection';
  }
}

TubiExperiments.ottSamsungRegistrationGenderCollection = 'OTT Fire TV Registration Gender Collection';

export const OTT_FIRETV_REGISTRATION_GENDER_COLLECTION_EXPERIMENT = {
  namespace: 'webott_samsung_registration_gender_collection',
  parameter: 'with_gender_gate',
};

export const getOTTSamsungRegistrationGenderCollectionConfig = () => {
  return {
    ...OTT_FIRETV_REGISTRATION_GENDER_COLLECTION_EXPERIMENT,
    id: TubiExperiments.ottSamsungRegistrationGenderCollection,
    experimentName: 'webott_samsung_registration_gender_collection',
    defaultValue: false,
    treatments: [
      { name: 'control' as const, value: false },
      { name: 'with_gender_gate' as const, value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
  };
};

const OTTSamsungRegistrationGenderCollection = (store?: Store<StoreState>) =>
  ExperimentManager(store).registerExperiment(getOTTSamsungRegistrationGenderCollectionConfig());

export default OTTSamsungRegistrationGenderCollection;
