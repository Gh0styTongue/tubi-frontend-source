import type {
  AdCompleteEventData,
  AdDiscontinueEventData,
  AdPodCompleteEventData,
  AdStallEventData,
  AdStartEventData,
  Player,
  PlayerListeners,
  AdPodFetch,
  AdPodFetchSuccess,
} from '@adrise/player';
import { PlayerName, PLAYER_EVENTS } from '@adrise/player';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { getFormatResolution } from 'common/features/playback/utils/getFormatResolution';
import trackingManager from 'common/services/TrackingManager';
import type { VideoResource } from 'common/types/video';

import { trackAdBeaconFailed, trackAdComplete, trackAdDiscontinue, trackAdPodFetchError, trackAdStall, trackAdStart, trackCuePointFilled } from '../track/client-log';
import { trackAdPodComplete } from '../track/client-log/trackAdPodComplete';
import { trackCapLevelOnFPSDrop } from '../track/client-log/trackCapLevelOnFPSDrop';
import { trackContentStart } from '../track/client-log/trackContentStart';

export const attachVODTracking = (
  player: InstanceType<typeof Player>,
  contentId: string,
  getVideoResource: () => VideoResource | undefined,
) => {
  if (![PlayerName.VOD, PlayerName.AD].includes(player.playerName)) {
    return () => {};
  }

  const onAdStart = ({ ad, adsCount, adSequence, adPosition, isPreroll, isPAL, adType }: AdStartEventData) => {
    trackingManager.startAdEvent({
      ad,
      adsCount,
      adSequence,
      contentId,
      adType,
      startPosition: adPosition,
      isFullscreen: __ISOTT__, // Ads are fullscreen on OTT
    });
    trackAdStart({
      player,
      contentId,
      ad,
      adsCount,
      adSequence,
      adPosition,
      isPreroll,
      isPAL,
      adType,
    });
  };

  const onAdStall = (data: AdStallEventData) => {
    trackAdStall({
      player,
      contentId,
      ...data,
    });
  };

  const onAdComplete = ({ ad, adsCount, adSequence, adPosition, isPreroll, isPAL, healthScores, adType }: AdCompleteEventData) => {
    trackingManager.finishAdEvent({
      ad,
      adsCount,
      adSequence,
      adType,
      contentId,
      endPosition: adPosition,
      isFullscreen: __ISOTT__, // Ads are fullscreen on OTT
    });
    trackAdComplete({
      player,
      contentId,
      ad,
      adsCount,
      adSequence,
      adPosition,
      isPreroll,
      isPAL,
      healthScores,
      adType,
    });
  };

  const onAdPodComplete = (data: AdPodCompleteEventData) => {
    trackAdPodComplete({
      contentId,
      ...data,
    });
  };

  const onAdResponse: PlayerListeners[PLAYER_EVENTS.adResponse] = ({ response, isPreroll, metrics, requestPosition }) => {
    if (!__ISOTT__ || isPreroll) {
      trackCuePointFilled({ contentId, player, response, metrics, requestPosition });
    }
  };

  const onAdDiscontinue = (event: AdDiscontinueEventData) => {
    trackAdDiscontinue({
      ...event,
      contentId,
      player,
    });
  };

  const onAdPodFetch: PlayerListeners[PLAYER_EVENTS.adPodFetch] = (data: AdPodFetch) => {
    VODPlaybackSession.getInstance().adPodFetch({
      isPreroll: data.isPreroll,
    });
  };

  const onAdPodFetchSuccess: PlayerListeners[PLAYER_EVENTS.adPodFetchSuccess] = (data: AdPodFetchSuccess) => {
    VODPlaybackSession.getInstance().adPodFetchSuccess({
      isPreroll: data.isPreroll,
      responseTime: data.responseTime,
    });
  };

  const onAdPodFetchError: PlayerListeners[PLAYER_EVENTS.adPodFetchError] = (error) => {
    VODPlaybackSession.getInstance().adPodFetchError({
      isPreroll: error.isPreroll,
    });
    trackAdPodFetchError(error);
  };

  const onContentStart: PlayerListeners[PLAYER_EVENTS.contentStart] = (event) => {
    const videoResource = getVideoResource();
    const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = player.getQualityLevel?.() ?? {};
    trackContentStart({
      contentId,
      videoResource,
      currentVideoResolution: getFormatResolution(currentResolutionWidth, currentResolutionHeight),
      ...event,
    });
  };

  const onCapLevelOnFPSDrop: PlayerListeners[PLAYER_EVENTS.capLevelOnFPSDrop] = (data) => {
    const videoResource = getVideoResource();
    trackCapLevelOnFPSDrop({ contentId, player, videoResource, data });
  };

  player.on(PLAYER_EVENTS.adStart, onAdStart);
  player.on(PLAYER_EVENTS.adStall, onAdStall);
  player.on(PLAYER_EVENTS.adComplete, onAdComplete);
  player.on(PLAYER_EVENTS.adResponse, onAdResponse);
  player.on(PLAYER_EVENTS.adDiscontinue, onAdDiscontinue);
  player.on(PLAYER_EVENTS.adPodFetch, onAdPodFetch);
  player.on(PLAYER_EVENTS.adPodFetchSuccess, onAdPodFetchSuccess);
  player.on(PLAYER_EVENTS.adPodFetchError, onAdPodFetchError);
  player.on(PLAYER_EVENTS.contentStart, onContentStart);
  player.on(PLAYER_EVENTS.adBeaconFail, trackAdBeaconFailed);
  player.on(PLAYER_EVENTS.capLevelOnFPSDrop, onCapLevelOnFPSDrop);
  player.on(PLAYER_EVENTS.adPodComplete, onAdPodComplete);

  return () => {
    player.removeListener(PLAYER_EVENTS.adStart, onAdStart);
    player.removeListener(PLAYER_EVENTS.adStall, onAdStall);
    player.removeListener(PLAYER_EVENTS.adComplete, onAdComplete);
    player.removeListener(PLAYER_EVENTS.adResponse, onAdResponse);
    player.removeListener(PLAYER_EVENTS.adDiscontinue, onAdDiscontinue);
    player.removeListener(PLAYER_EVENTS.adPodFetch, onAdPodFetch);
    player.removeListener(PLAYER_EVENTS.adPodFetchSuccess, onAdPodFetchSuccess);
    player.removeListener(PLAYER_EVENTS.adPodFetchError, onAdPodFetchError);
    player.removeListener(PLAYER_EVENTS.contentStart, onContentStart);
    player.removeListener(PLAYER_EVENTS.adBeaconFail, trackAdBeaconFailed);
    player.removeListener(PLAYER_EVENTS.capLevelOnFPSDrop, onCapLevelOnFPSDrop);
    player.removeListener(PLAYER_EVENTS.adPodComplete, onAdPodComplete);
  };
};
