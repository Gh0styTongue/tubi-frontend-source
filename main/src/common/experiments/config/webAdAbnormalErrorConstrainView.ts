import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webAdAbnormalErrorConstrainView: 'webott_web_ad_abnormal_error_constrain_view_v1';
  }
}

TubiExperiments.webAdAbnormalErrorConstrainView = 'webott_web_ad_abnormal_error_constrain_view_v1';

export const WEB_AD_ABNORMAL_ERROR_CONSTRAIN_VIEW = {
  namespace: 'webott_web_ad_abnormal_error_constrain_view',
  parameter: 'enable_constrain_view_v1',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'constrain_view';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...WEB_AD_ABNORMAL_ERROR_CONSTRAIN_VIEW,
    id: TubiExperiments.webAdAbnormalErrorConstrainView,
    experimentName: 'webott_web_ad_abnormal_error_constrain_view_v1',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'constrain_view', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
