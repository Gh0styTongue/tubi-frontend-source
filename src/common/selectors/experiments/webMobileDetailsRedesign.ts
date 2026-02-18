import { getConfig, WEB_MOBILE_DETAILS_REDESIGN, WEB_MOBILE_DETAILS_REDESIGN_VALUE } from 'common/experiments/config/webMobileDetailsRedesign';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webMobileDetailsRedesignSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_MOBILE_DETAILS_REDESIGN,
    config: getConfig(),
  });

export const isInWebMobileDetailsRedesignSelector = (state: StoreState) => {
  return webMobileDetailsRedesignSelector(state) !== WEB_MOBILE_DETAILS_REDESIGN_VALUE.CONTROL;
};
