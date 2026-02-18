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
import { getFormatResolution } from '@adrise/utils/lib/getFormatResolution';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import trackingManager from 'common/services/TrackingManager';
import type { VideoResource } from 'common/types/video';

import { trackAdBeaconFailed, trackAdComplete, trackAdDiscontinue, trackAdPlayerSetupError, trackAdPodFetch, trackAdPodFetchError, trackAdStall, trackAdStart, trackCuePointFilled } from '../track/client-log';
import { trackAdPodComplete } from '../track/client-log/trackAdPodComplete';
import { trackAdsGoldenPrefetchPoint } from '../track/client-log/trackAdsGoldenPrefetchPoint';
import { trackContentStart } from '../track/client-log/trackContentStart';
import { trackNativeAdsFallback } from '../track/client-log/trackNativeAdsFallback';

export const attachVODTracking = (
  player: InstanceType<typeof Player>,
  contentId: string,
  getVideoResource: () => VideoResource | undefined,
  getPlayerDisplayMode: () => PlayerDisplayMode,
) => {
  if (![PlayerName.VOD, PlayerName.AD].includes(player.playerName)) {
    return () => {};
  }

  const onAdStart = (event: AdStartEventData) => {
    const { ad, adsCount, adSequence, adPosition, adType } = event;
    trackingManager.startAdEvent({
      ad,
      adsCount,
      adSequence,
      contentId,
      adType,
      startPosition: adPosition,
      isFullscreen: __ISOTT__, // Ads are fullscreen on OTT
      getPlayerDisplayMode,
    });
    trackAdStart({
      player,
      contentId,
      adType,
      ...event,
    });
  };

  const onAdStall = (data: AdStallEventData) => {
    trackAdStall({
      player,
      contentId,
      ...data,
    });
  };

  const onAdComplete = (event: AdCompleteEventData) => {
    const { ad, adsCount, adSequence, adPosition, adType } = event;
    trackingManager.finishAdEvent({
      ad,
      adsCount,
      adSequence,
      adType,
      contentId,
      endPosition: adPosition,
      isFullscreen: __ISOTT__, // Ads are fullscreen on OTT
      getPlayerDisplayMode,
    });
    trackAdComplete({
      player,
      contentId,
      ...event,
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
      adsCount: data.adsCount,
    });

    if (data.skipTracking) {
      return;
    }

    trackAdPodFetch({
      adType: data.isPreroll ? 'preroll' : 'midroll',
      isError: false,
      metrics: {
        networkResponseTime: data.networkResponseTime,
        retries: data.retries,
        responseTime: data.responseTime,
        timeout: data.timeout,
        maxRetries: data.maxRetries,
      },
      adsCount: data.adsCount,
    });
  };

  const onAdPodFetchError: PlayerListeners[PLAYER_EVENTS.adPodFetchError] = (error) => {
    VODPlaybackSession.getInstance().adPodFetchError({
      isPreroll: error.isPreroll,
    });

    trackAdPodFetchError(error);

    trackAdPodFetch({
      adType: error.isPreroll ? 'preroll' : 'midroll',
      isError: true,
      metrics: {
        retries: error.retries,
        responseTime: error.responseTime,
        timeout: error.timeout,
        maxRetries: error.maxRetries,
      },
      message: error.message,
    });
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

  const onCloseToLastPrerollAds: PlayerListeners[PLAYER_EVENTS.closeToLastPrerollAds] = () => {
    const bufferLength = player.getBufferedLength?.() || 0;
    const position = player.getAdPosition?.() || 0;
    const duration = player.getCurrentAd?.()?.duration || 0;
    const remainingDuration = duration - position;

    trackAdsGoldenPrefetchPoint({
      content_id: contentId,
      position,
      duration,
      remainingDuration,
      bufferLength,
    });
  };

  const onNativeAdsFallback: PlayerListeners[PLAYER_EVENTS.nativeAdsFallback] = (event) => {
    trackNativeAdsFallback(event);
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
  player.on(PLAYER_EVENTS.adPodComplete, onAdPodComplete);
  player.on(PLAYER_EVENTS.closeToLastPrerollAds, onCloseToLastPrerollAds);
  player.on(PLAYER_EVENTS.nativeAdsFallback, onNativeAdsFallback);
  player.on(PLAYER_EVENTS.adPlayerSetupError, trackAdPlayerSetupError);

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
    player.removeListener(PLAYER_EVENTS.adPodComplete, onAdPodComplete);
    player.removeListener(PLAYER_EVENTS.closeToLastPrerollAds, onCloseToLastPrerollAds);
    player.removeListener(PLAYER_EVENTS.nativeAdsFallback, onNativeAdsFallback);
    player.removeListener(PLAYER_EVENTS.adPlayerSetupError, trackAdPlayerSetupError);
  };
};
