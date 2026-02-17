import {
  getConfig,
  TIVO_ENABLE_PLAYREADY_DRM,
} from 'common/experiments/config/ottTivoEnablePlayreadyDrm';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottTivoEnablePlayreadySelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...TIVO_ENABLE_PLAYREADY_DRM,
  config: getConfig(),
});
