import { getConfig, WEB_DIRECT_TO_PLAYER } from 'common/experiments/config/webDirectToPlayer';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import type { StoreState } from 'common/types/storeState';

export const webDirectToPlayerSelector = (state: StoreState) =>
  popperExperimentsSelector(state, {
    ...WEB_DIRECT_TO_PLAYER,
    config: getConfig(),
  });
