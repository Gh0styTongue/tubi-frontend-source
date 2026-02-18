import { createSelector } from 'reselect';

import {
  getConfig,
  DELAY_LOAD_HOMESCREEN_PARAM,
  DELAY_LOAD_HOMESCREEN_EXPERIMENT_PARAM,
} from 'common/experiments/config/ottMajorPlatformsDelayLoadHomescreen';
import { getExperiment } from 'common/experimentV2';
import { webottMajorPlatformsDelayLoadHomescreen } from 'common/experimentV2/configs/webottMajorPlatformsDelayLoadHomescreen';
import { experimentParameterSelector, popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottMajorPlatformsDelayLoadHomescreenSelector = (state: StoreState) => {

  const experiment = experimentParameterSelector(state, {
    ...DELAY_LOAD_HOMESCREEN_EXPERIMENT_PARAM,
  });
  if (experiment?.treatment) {
    return popperExperimentsSelector(state, {
      ...DELAY_LOAD_HOMESCREEN_EXPERIMENT_PARAM,
      config: getConfig(),
    });
  }
  return getExperiment(webottMajorPlatformsDelayLoadHomescreen).get('delay_load_homescreen_strategy');
};

export const shouldLoadHomescreenAfterRenderSelector = createSelector(
  ottMajorPlatformsDelayLoadHomescreenSelector,
  ({
    ottUI: {
      intro: { shouldLoadHomescreenAfterRender },
    },
  }: StoreState) => shouldLoadHomescreenAfterRender,
  (experimentValue, shouldLoadHomescreenAfterRender) => {
    return shouldLoadHomescreenAfterRender && experimentValue === DELAY_LOAD_HOMESCREEN_PARAM.DELAY_LOAD_HOMESCREEN;
  }
);
