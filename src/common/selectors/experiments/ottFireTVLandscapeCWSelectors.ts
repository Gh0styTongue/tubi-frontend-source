import { FIRETV_LANDSCAPE_CW, getConfig } from 'common/experiments/config/ottFireTVLandscapeCW';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVLandscapeCWSelectors = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_LANDSCAPE_CW,
  config: getConfig(),
});
