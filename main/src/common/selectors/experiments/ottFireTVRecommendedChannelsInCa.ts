import {
  getConfig,
  FIRETV_RECOMMENDED_CHANNELS_IN_CA,
} from 'common/experiments/config/ottFireTVRecommendedChannelsInCa';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVRecommendedChannelsInCaSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_RECOMMENDED_CHANNELS_IN_CA,
  config: getConfig(),
});
