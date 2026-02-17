import {
  type AdError,
  type Player,
  type AdResponseEventData,
  type AdStartEventData,
  type ContentStartData,
  type AdPodEmptyEventData,
  type TimeEventData,
  PLAYER_EVENTS } from '@adrise/player';

import { adError, adPodStart, adStall, adStart, contentStart, cuePointFilled, adPodEmpty, paused, playerReady, reattachVideoElement, reloadSrc, timeupdate } from '../session/VODPageSession';

export const attachVODPageSessionEvents = (player: InstanceType<typeof Player>) => {
  const onAdPodEmpty = ({ isPreroll }: AdPodEmptyEventData) => adPodEmpty(isPreroll);
  const onReady = () => playerReady();
  const onAdResponse = ({ isPreroll }: AdResponseEventData) => {
    if (!__ISOTT__ || isPreroll) {
      cuePointFilled(isPreroll);
    }
  };
  const onAdStart = ({ adSequence, isPreroll }: AdStartEventData) => {
    if (adSequence === 1) {
      adPodStart(isPreroll);
    }
    adStart(isPreroll);
  };
  const onAdStall = () => adStall();
  const onContentStart = ({ position }: ContentStartData) => {
    contentStart(position);
  };
  const onTime = ({ position }: TimeEventData) => {
    timeupdate(position);
  };
  const onAdError = (error: AdError) => {
    adError(error);
  };
  const onPause = () => paused();
  const onAdPause = () => paused();
  const onReload = () => reloadSrc();
  const onReattachVideoElement = () => reattachVideoElement();

  player.on(PLAYER_EVENTS.ready, onReady);
  player.on(PLAYER_EVENTS.adPodEmpty, onAdPodEmpty);
  player.on(PLAYER_EVENTS.adResponse, onAdResponse);
  player.on(PLAYER_EVENTS.adStart, onAdStart);
  player.on(PLAYER_EVENTS.adStall, onAdStall);
  player.on(PLAYER_EVENTS.contentStart, onContentStart);
  player.on(PLAYER_EVENTS.time, onTime);
  player.on(PLAYER_EVENTS.adError, onAdError);
  player.on(PLAYER_EVENTS.pause, onPause);
  player.on(PLAYER_EVENTS.adPause, onAdPause);
  player.on(PLAYER_EVENTS.reload, onReload);
  player.on(PLAYER_EVENTS.reattachVideoElement, onReattachVideoElement);

  return () => {
    player.removeListener(PLAYER_EVENTS.ready, onReady);
    player.removeListener(PLAYER_EVENTS.adPodEmpty, onAdPodEmpty);
    player.removeListener(PLAYER_EVENTS.adResponse, onAdResponse);
    player.removeListener(PLAYER_EVENTS.adStart, onAdStart);
    player.removeListener(PLAYER_EVENTS.adStall, onAdStall);
    player.removeListener(PLAYER_EVENTS.contentStart, onContentStart);
    player.removeListener(PLAYER_EVENTS.time, onTime);
    player.removeListener(PLAYER_EVENTS.adError, onAdError);
    player.removeListener(PLAYER_EVENTS.pause, onPause);
    player.removeListener(PLAYER_EVENTS.adPause, onAdPause);
    player.removeListener(PLAYER_EVENTS.reload, onReload);
    player.removeListener(PLAYER_EVENTS.reattachVideoElement, onReattachVideoElement);
  };
};
