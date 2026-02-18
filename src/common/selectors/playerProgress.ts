import type StoreState from 'common/types/storeState';

export function durationSelector(state: StoreState) {
  return state.player.progress.duration;
}

export function positionSelector(state: StoreState) {
  return state.player.progress.position;
}

export function bufferPositionSelector(state: StoreState) {
  return state.player.progress.bufferPosition;
}

export function isBufferingSelector(state: StoreState) {
  return state.player.progress.isBuffering;
}

