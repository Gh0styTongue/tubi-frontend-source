import { createSelector } from 'reselect';

import { getConfig, FIRETV_RTU_PARAM, FIRETV_RTU } from 'common/experiments/config/ottFireTVRTU';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';

const ottFireTVRTUSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...FIRETV_RTU_PARAM,
    config: getConfig(),
  });

export const shouldDisabledIntroVideoSelector = createSelector(ottFireTVRTUSelector, (experimentValue) => {
  return (
    experimentValue !== FIRETV_RTU.CONTROL || FeatureSwitchManager.get('RTUImprovementTest') !== 'default'
  );
});

export const shouldLoadHomescreenAfterRenderSelector = createSelector(
  ottFireTVRTUSelector,
  ({ ottUI: { intro: { shouldLoadHomescreenAfterRender } } }: StoreState) => shouldLoadHomescreenAfterRender,
  (experimentValue, shouldLoadHomescreenAfterRender) => {
    return (
      shouldLoadHomescreenAfterRender && (experimentValue === FIRETV_RTU.DISABLE_INTRO_LOAD_HOMESCREEN_LATER ||
    FeatureSwitchManager.get('RTUImprovementTest') === 'disableIntro10MinLoadHomescreenLater')
    );
  });
