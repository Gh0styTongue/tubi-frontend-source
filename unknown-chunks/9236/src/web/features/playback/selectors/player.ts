import { PLAYER_CONTENT_TYPE } from '@adrise/player';

import type StoreState from 'common/types/storeState';

export const bufferPositionSelector = (state: StoreState) => state.player.progress.bufferPosition;

export const isBufferingSelector = (state: StoreState) => state.player.progress.isBuffering;

export const durationSelector = (state: StoreState) => state.player.progress.duration;

export const castDurationSelector = (state: StoreState) => {
  const contentId = state.chromecast.contentId;
  const castingContent = state.video.byId[contentId] || {};
  return castingContent.duration;
};

export const castPositionSelector = (state: StoreState) => state.chromecast.position;

export const isAdSelector = (state: StoreState) => state.player.contentType === PLAYER_CONTENT_TYPE.ad;

export const castIsAdSelector = (state: StoreState) => state.chromecast.isAd;

export const canAutoplaySelector = (state: StoreState) => state.player.canAutoplay;

export const adSequenceSelector = (state: StoreState) => state.player.ad.adSequence;

export const isMutedSelector = (state: StoreState) => state.player.volume.isMuted;

export const volumeSelector = (state: StoreState) => state.player.volume.volume;

export const qualityListSelector = (state: StoreState) => state.player.quality.qualityList;

export const qualityIndexSelector = (state: StoreState) => state.player.quality.qualityIndex;

export const isHDSelector = (state: StoreState) => state.player.quality.isHD;

export const qualityLevelSelector = (state: StoreState) => state.player.quality.qualityList[state.player.quality.qualityIndex];
