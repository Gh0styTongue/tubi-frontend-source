import {
  PLAYER_EVENTS,
} from '@adrise/player';
import type {
  Player,
  PlayerListeners,
} from '@adrise/player';

import {
  adError,
  adStall,
  adTime,
  adFirstFrameViewed,
  adCurrentTimeProgressed,
  contentStartLoad,
  contentFirstFrameViewed,
  contentCurrentTimeProgressed,
  cuePointFilled,
  adPodFetch,
  adPodFetchSuccess,
  adPodFetchError,
  adPodEmpty,
  paused,
  reattachVideoElement,
  reloadSrc,
  timeupdate,
  adPaused,
  setExtensionReady,
  adPlayerSetup,
  adStartLoad,
  adPodComplete,
} from '../session/VODPageSession';

export const attachVODPageSessionEvents = (player: InstanceType<typeof Player>) => {
  const listenerMap: {
    [K in keyof PlayerListeners]: [K, PlayerListeners[K]]
  }[keyof PlayerListeners][] = [
    [PLAYER_EVENTS.adPodFetch, adPodFetch],
    [PLAYER_EVENTS.adPodFetchSuccess, adPodFetchSuccess],
    [PLAYER_EVENTS.adPodFetchError, adPodFetchError],
    [PLAYER_EVENTS.adPodEmpty, adPodEmpty],
    [PLAYER_EVENTS.adResponse, cuePointFilled],
    [PLAYER_EVENTS.adPlayerSetup, adPlayerSetup],
    [PLAYER_EVENTS.adStartLoad, adStartLoad],
    [PLAYER_EVENTS.adStart, adFirstFrameViewed],
    [PLAYER_EVENTS.adCurrentTimeProgressed, adCurrentTimeProgressed],
    [PLAYER_EVENTS.adStall, adStall],
    [PLAYER_EVENTS.adTime, adTime],
    [PLAYER_EVENTS.adPodComplete, adPodComplete],
    [PLAYER_EVENTS.startLoad, contentStartLoad],
    [PLAYER_EVENTS.ready, contentFirstFrameViewed],
    [PLAYER_EVENTS.currentTimeProgressed, contentCurrentTimeProgressed],
    [PLAYER_EVENTS.time, timeupdate],
    [PLAYER_EVENTS.adError, adError],
    [PLAYER_EVENTS.pause, paused],
    [PLAYER_EVENTS.adPause, adPaused],
    [PLAYER_EVENTS.reload, reloadSrc],
    [PLAYER_EVENTS.reattachVideoElement, reattachVideoElement],
    [PLAYER_EVENTS.extensionReady, setExtensionReady],
  ];

  for (const listener of listenerMap) {
    player.on(listener[0], listener[1]);
  }

  return () => {
    for (const listener of listenerMap) {
      player.removeListener(listener[0], listener[1]);
    }
  };
};
