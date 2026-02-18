import { PLAYER_CONTENT_TYPE } from '@adrise/player';
import type { PlayerContentType } from '@adrise/player/lib/constants/constants';

import { PLAYER_STATES } from 'common/constants/player';
import type StoreState from 'common/types/storeState';

export function contentTypeSelector(state: StoreState): PlayerContentType {
  return state.player.contentType;
}

export function playerStateSelector(state: StoreState) {
  return state.player.playerState;
}

export function isPlayingSelector(state: StoreState) {
  return state.player.playerState === PLAYER_STATES.playing;
}

export function isAdSelector(state: StoreState) {
  return state.player.contentType === PLAYER_CONTENT_TYPE.ad;
}

