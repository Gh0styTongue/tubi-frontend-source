import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDebounceBackgroundImageRerun: 'webott_firetv_debounce_background_image_rerun_v1';
  }
}

TubiExperiments.ottFireTVDebounceBackgroundImageRerun = 'webott_firetv_debounce_background_image_rerun_v1';

export const FIRETV_DEBOUNCE_BACKGROUND_IMAGE = {
  namespace: 'webott_firetv_debounce_background_image_rerun_v1',
  parameter: 'variant',
};

export enum DEBOUNCE_BACKGROUND_IMAGE_VARIANT {
  control = 'control',
  use_leading_debounce = 'use_leading_debounce',
  use_short_debounce_timing = 'use_short_debounce_timing',
  never_set_image_expire = 'never_set_image_expire',
}

export const getConfig = () => {
  return {
    ...FIRETV_DEBOUNCE_BACKGROUND_IMAGE,
    id: TubiExperiments.ottFireTVDebounceBackgroundImageRerun,
    experimentName: 'webott_firetv_debounce_background_image_rerun_v1',
    defaultValue: 'control',
    treatments: [
      { name: 'control', value: 'control' },
      { name: 'use_leading_debounce', value: DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_leading_debounce },
      { name: 'use_short_debounce_timing', value: DEBOUNCE_BACKGROUND_IMAGE_VARIANT.use_short_debounce_timing },
      { name: 'never_set_image_expire', value: DEBOUNCE_BACKGROUND_IMAGE_VARIANT.never_set_image_expire },
    ],
    enabledSelector: ({
      ui: {
        userAgent: {
          ua,
        },
      },
    }: StoreState) => {
      // We cannot use ui.userAgent.device.model, which is not correct sometime. Cause the ua-parser has its own parsing rules.
      // We also cannot use ottSystem.deviceModel cause we set the state in systemApi. It cannot be used on server side
      // There will throw an error if we use it.
      const deviceModel = (ua.match(/Android\s[\d.]+;\s(.*)\sBuild\//) ?? [])[1];
      const treatmentDeviceModels = ['AFTT'];
      return __OTTPLATFORM__ === 'FIRETV_HYB' && treatmentDeviceModels.includes(deviceModel);
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
