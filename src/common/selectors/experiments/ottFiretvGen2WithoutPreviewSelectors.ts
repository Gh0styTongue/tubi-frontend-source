import { getConfig, FIRETV_GEN2_WITHOUT_PREVIEW } from 'common/experiments/config/ottFiretvGen2WithoutPreview';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFiretvGen2WithoutPreviewSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...FIRETV_GEN2_WITHOUT_PREVIEW,
    config: getConfig(),
  });

