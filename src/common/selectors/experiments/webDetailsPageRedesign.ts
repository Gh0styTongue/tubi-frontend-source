import { getConfig, WEB_DETAILS_PAGE_REDESIGN } from 'common/experiments/config/webDetailsPageRedesign';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webDetailsPageRedesignSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_DETAILS_PAGE_REDESIGN,
    config: getConfig(),
  });
