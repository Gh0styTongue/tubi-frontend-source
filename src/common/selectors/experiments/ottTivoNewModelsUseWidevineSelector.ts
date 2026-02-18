import {
  getConfig,
  TIVO_NEW_MODELS_USE_WIDEVINE,
} from 'common/experiments/config/ottTivoNewModelsUseWidevine';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottTivoNewModelsUseWidevineSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...TIVO_NEW_MODELS_USE_WIDEVINE,
  config: getConfig(),
});
