import {
  fetchJsonAds,
  PLAYER_EVENTS,
  VAST_AD_NOT_USED,
  sendVASTNotUsedBeacon,
} from '@adrise/player';
import { useCallback, useMemo, useRef } from 'react';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { trackAdBeaconFailed } from 'client/features/playback/track/client-log/trackAdBeaconFailed';
import { trackAdMissed } from 'client/features/playback/track/client-log/trackAdMissed';
import { trackAdPodFetchError } from 'client/features/playback/track/client-log/trackAdPodFetchError';
import { trackFloatCuePoint } from 'client/features/playback/track/client-log/trackFloatCuePoint';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useDecoupledPlayerEvent } from 'common/features/playback/hooks/usePlayerEvent';
import { getAdOrigin } from 'common/features/playback/utils/adOrigin';
import { adRequestProcessorForWeb } from 'common/features/playback/utils/adTools';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isEspanolModeEnabledSelector, isKidsModeSelector, osNameSelector } from 'common/selectors/ui';
import FeatureSwitchManager, { AD_MOCK_LIST } from 'common/services/FeatureSwitchManager';
import trackingManager from 'common/services/TrackingManager';
import type { Video } from 'common/types/video';
import { getAppMode } from 'common/utils/appMode';
import { formatCuePoint } from 'common/utils/formatCuePoint';
import { getWebAdUrl } from 'web/features/playback/utils/getWebAdUrl';
export interface UseAdsParams {
  adBreaks: number[];
  isFromAutoplay: boolean;
  video: Video
  isDeeplink: boolean;
  showAutoPlay: boolean;
}

type AdSchedule = Record<number, { adPlayed: boolean }>;

const formatCuePointToInteger = (adBreaks: number[], contentId: string, isFromAutoplay: boolean, isDeeplink: boolean): readonly number[] => {
  const { cuePointList, hasFloatCuePoint } = formatCuePoint(adBreaks);

  if (hasFloatCuePoint) {
    trackFloatCuePoint({
      cuePointList: adBreaks,
      contentId,
      isFromAutoplay,
      isDeeplink,
    });
  }

  return cuePointList;
};

const makeAdSchedule = (adBreaks: readonly number[]): AdSchedule => {
  return adBreaks.reduce<Record<number, { adPlayed: boolean }>>((acc, adBreak) => {
    if (adBreak !== 0) acc[adBreak] = { adPlayed: false };
    return acc;
  }, {});
};

const NO_PLAYER_INSTANCE_WHEN_ATTACHING_AD_RULES = 'No Player instance when attaching ad rules';

export const useAds = ({ adBreaks, isFromAutoplay, video, isDeeplink, showAutoPlay }: UseAdsParams) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const contentId = video.id;
  const publisherId = video.publisher_id;
  const deviceId = useAppSelector(deviceIdSelector);
  const userId = useAppSelector(userIdSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isEspanolModeEnabled = useAppSelector(isEspanolModeEnabledSelector);
  const osName = useAppSelector(osNameSelector);
  const cuePointList = formatCuePointToInteger(adBreaks, contentId, isFromAutoplay, isDeeplink);
  const adScheduleRef = useRef<AdSchedule>(makeAdSchedule(cuePointList));
  const showAutoPlayRef = useRef<boolean>(showAutoPlay);
  showAutoPlayRef.current = showAutoPlay;

  /**
   * Are ads disabled for this session / platform?
   */
  const adsDisabled = useCallback(() => {
    const isProduction = __PRODUCTION__ && !__IS_ALPHA_ENV__;
    return !isProduction && FeatureSwitchManager.isDisabled(['Ad', 'Availability']);
  }, []);

  /**
   * Are preroll ads enabled for this session?
   */
  const isPrerollEnabled = useCallback(() => {
    const prerollDisabled = ['noPreroll', 'noOdd'].includes(FeatureSwitchManager.get(['Ad', 'Availability']) as string);
    const noBreakInBeginning = cuePointList.indexOf(0) === -1;
    return !adsDisabled() && !prerollDisabled && !noBreakInBeginning;
  }, [cuePointList, adsDisabled]);

  /**
   * Intended to track any ads we have fetched but not played
   */
  const trackNotUsedAds = useCallback(() => {
    const {
      stage,
    } = getVODPageSession();
    const player = getPlayerInstance();

    switch (stage) {
      case 'PREROLL':
      case 'MIDROLL':
        const adlist = player?.getAdList();
        const adSequence = player?.getAdSequence();
        if (!adlist || !adSequence) break;
        sendVASTNotUsedBeacon(adlist, VAST_AD_NOT_USED.EXIT_MID_POD, adSequence, (err) => {
          trackAdBeaconFailed(err, { type: 'notUsed' });
        });
        break;
      default:
        break;
    }
  }, [getPlayerInstance]);

  /**
   * Is the current playback session from autoplay?
   */
  const isAutomaticAutoplay = useMemo(() => {
    if (__SERVER__) {
      return !!isFromAutoplay;
    }
    return !!(isFromAutoplay && !trackingManager.getState().fromAutoplayDeliberate);
  }, [isFromAutoplay]);

  /**
   * Get the content ad url for the current position
   */
  const getContentAdUrl = useCallback((position: number, resumeType?: string) => {
    // TODO: this is untestable due to the way __IS_PRODUCTION__ is set in
    // FeatureSwitchManager.ts
    /* istanbul ignore if */
    if (adsDisabled()) {
      if (!AD_MOCK_LIST.EmptyAd) {
        throw new Error('Mock List Empty Ad should be a string');
      }
      return AD_MOCK_LIST.EmptyAd;
    }
    if (!FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
      const mockUrl = FeatureSwitchManager.get(['Ad', 'MockUrl']);
      if (typeof mockUrl !== 'string') {
        throw new Error('Mock URL should be string');
      }
      return mockUrl;
    }

    const { origin, containerId } = getAdOrigin({
      isDeeplink,
      isFromAutoplay,
      isAutomaticAutoplay,
    });

    const options = {
      contentId,
      deviceId,
      position,
      publisherId,
      userId,
      appMode: getAppMode({ isKidsModeEnabled, isEspanolModeEnabled }),
      resumeType,
      isFromAutoplay,
      origin,
      containerId,
      needAuth: true,
      os: osName,
    };

    return getWebAdUrl(options);

  }, [isAutomaticAutoplay, adsDisabled, deviceId, contentId, publisherId, userId, isKidsModeEnabled, isEspanolModeEnabled, isDeeplink, isFromAutoplay, osName]);

  const getContentAdUrlRef = useRef<(position: number, resumeType?: string) => string>(getContentAdUrl);
  getContentAdUrlRef.current = getContentAdUrl;

  /**
   * Intended to be subscribed to the player's onTime event after player
   * creation and unsubscribed before player destruction. As such, is not
   * regenerated on prop changes and must depend on refs to access stateful
   * values. Note that preroll is added in Player wrapper
   */
  const contentIdRef = useLatest(contentId);
  const onTime = useCallback(({ position }: { position: number }) => {
    // type guard - imposisble to hit this case, this callback is a player event
    const player = getPlayerInstance();
    /* istanbul ignore next */
    if (!player) throw new Error(NO_PLAYER_INSTANCE_WHEN_ATTACHING_AD_RULES);
    if (player.getIsAdFetching()) return;
    const nowPos = Math.floor(position);

    const adSchedule = adScheduleRef.current;
    if (adSchedule.hasOwnProperty(nowPos) && !adSchedule[nowPos].adPlayed) {
      // `adPlayed` is really _attempted_ ad playback...
      adSchedule[nowPos].adPlayed = true;

      // fetch and play ads at the current position
      const adUrl = getContentAdUrlRef.current(position);
      const isDefaultAdMockUrl = FeatureSwitchManager.isDefault(['Ad', 'MockUrl']);
      VODPlaybackSession.getInstance().adPodFetch({
        isPreroll: false,
      });
      fetchJsonAds(adUrl, {
        requestProcessBeforeFetch: adRequestProcessorForWeb(isDefaultAdMockUrl),
      }).then(({ ads, metrics }) => {
        VODPlaybackSession.getInstance().adPodFetchSuccess({
          isPreroll: false,
          responseTime: metrics.responseTime,
        });
        if (ads) {
          if (showAutoPlayRef.current) {
            trackAdMissed({
              isPreroll: false,
              position: player.getPosition(),
              scene: VAST_AD_NOT_USED.EXIT_PRE_POD,
              reason: 'autoPlay',
              contentId: contentIdRef.current,
            });
            return;
          }
          player.playAdResponse(ads);
        }
      }).catch((error) => {
        VODPlaybackSession.getInstance().adPodFetchError({
          isPreroll: false,
        });
        trackAdPodFetchError({
          isPreroll: false,
          message: error?.message,
        });
      });
    }

    // Intentionally no dependencies, here. This callback should only
    // make use of refs and not state or props, or it will get stale values!
  }, [contentIdRef, getPlayerInstance]);

  useDecoupledPlayerEvent(PLAYER_EVENTS.time, onTime);

  const cuePointListRef = useLatest(cuePointList);
  useDecoupledPlayerEvent(PLAYER_EVENTS.setup, useCallback(() => {
    adScheduleRef.current = makeAdSchedule(cuePointListRef.current);
  }, [cuePointListRef]));

  return {
    isPrerollEnabled,
    trackNotUsedAds,
    getContentAdUrl,
    // returned only for testing
    adsDisabled,
    isAutomaticAutoplay,
  };
};
