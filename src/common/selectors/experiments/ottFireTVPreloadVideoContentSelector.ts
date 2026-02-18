import { getConfig, FIRETV_PRELOAD_VIDEO_CONTENT } from 'common/experiments/config/ottFireTVPreloadVideoContent';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVPreloadVideoContentSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...FIRETV_PRELOAD_VIDEO_CONTENT,
    config: getConfig(),
  });
