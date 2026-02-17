import { getConfig, FIRETV_SKINS_AD } from 'common/experiments/config/ottFireTVSkinsAd';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVSkinsAdSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_SKINS_AD,
  config: getConfig(),
});
