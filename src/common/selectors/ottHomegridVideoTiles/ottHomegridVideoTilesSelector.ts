import {
  HOMEGRID_VIDEO_TILES,
  getConfig,
} from 'common/experiments/config/ottHomegridVideoTiles';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const ottHomegridVideoTilesSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...HOMEGRID_VIDEO_TILES,
  config: getConfig(),
});
