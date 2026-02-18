import type StoreState from 'common/types/storeState';

export function adSelector(state: StoreState) {
  return state.player.ad;
}

