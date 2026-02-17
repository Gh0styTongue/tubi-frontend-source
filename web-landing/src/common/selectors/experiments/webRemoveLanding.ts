import { getWebRemoveLandingPageExperimentConfig } from 'common/experiments/config/webRemoveLandingPage';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webRemoveLandingPageExperimentSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    parameter: 'landing_page',
    namespace: 'webott_web_remove_landing_v4',
    experimentName: 'webott_web_remove_landing_v4',
    config: getWebRemoveLandingPageExperimentConfig(),
  });
