import type {
  Player } from '@adrise/player';
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
import { AdMissedReason, trackAdMissed } from 'client/features/playback/track/client-log/trackAdMissed';
import { trackAdPodFetchError } from 'client/features/playback/track/client-log/trackAdPodFetchError';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import { getAdOrigin } from 'common/features/playback/utils/adOrigin';
import { adRequestProcessorForWeb } from 'common/features/playback/utils/adTools';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isEspanolModeEnabledSelector, isKidsModeSelector } from 'common/selectors/ui';
import FeatureSwitchManager, { AD_MOCK_LIST } from 'common/services/FeatureSwitchManager';
import trackingManager from 'common/services/TrackingManager';
import type { Video } from 'common/types/video';
import { getAppMode } from 'common/utils/appMode';
import { getWebAdUrl } from 'web/features/playback/utils/getWebAdUrl';
export interface UseAdsParams {
  adBreaks: number[];
  playerRef: React.MutableRefObject<InstanceType<typeof Player> | null>;
  isFromAutoplay: boolean;
  video: Video
  isDeeplink: boolean;
  showAutoPlay: boolean;
}

type AdSchedule = Record<number, { adPlayed: boolean }>;

const makeAdSchedule = (adBreaks: number[]): AdSchedule => {
  return adBreaks.reduce<Record<number, { adPlayed: boolean }>>((acc, adBreak) => {
    if (adBreak !== 0) acc[adBreak] = { adPlayed: false };
    return acc;
  }, {});
};

const NO_PLAYER_INSTANCE_WHEN_ATTACHING_AD_RULES = 'No Player instance when attaching ad rules';

export const useAds = ({ adBreaks, playerRef, isFromAutoplay, video, isDeeplink, showAutoPlay }: UseAdsParams) => {
  const contentId = video.id;
  const publisherId = video.publisher_id;
  const deviceId = useAppSelector(deviceIdSelector);
  const userId = useAppSelector(userIdSelector);
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isEspanolModeEnabled = useAppSelector(isEspanolModeEnabledSelector);
  const adScheduleRef = useRef<AdSchedule>(makeAdSchedule(adBreaks));
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
    const noBreakInBeginning = adBreaks.indexOf(0) === -1;
    return !adsDisabled() && !prerollDisabled && !noBreakInBeginning;
  }, [adBreaks, adsDisabled]);

  /**
   * Intended to track any ads we have fetched but not played
   */
  const trackNotUsedAds = useCallback(() => {
    const {
      stage,
    } = getVODPageSession();

    switch (stage) {
      case 'PREROLL':
      case 'MIDROLL':
        const adlist = playerRef.current?.getAdList();
        const adSequence = playerRef.current?.getAdSequence();
        if (!adlist || !adSequence) break;
        sendVASTNotUsedBeacon(adlist, VAST_AD_NOT_USED.EXIT_MID_POD, adSequence, (err) => {
          trackAdBeaconFailed(err, { type: 'notUsed' });
        });
        break;
      default:
        break;
    }
  }, [playerRef]);

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
    };

    return getWebAdUrl(options);

  }, [isAutomaticAutoplay, adsDisabled, deviceId, contentId, publisherId, userId, isKidsModeEnabled, isEspanolModeEnabled, isDeeplink, isFromAutoplay]);

  const getContentAdUrlRef = useRef<(position: number, resumeType?: string) => string>(getContentAdUrl);
  getContentAdUrlRef.current = getContentAdUrl;

  /**
   * Intended to be subscribed to the player's onTime event after player
   * creation and unsubscribed before player destruction. As such, is not
   * regenerated on prop changes and must depend on refs to access stateful
   * values. Note that preroll is added in Player wrapper
   */
  const onTime = useCallback(({ position }: { position: number }) => {
    // type guard - imposisble to hit this case, this callback is a player event
    /* istanbul ignore next */
    if (!playerRef.current) throw new Error(NO_PLAYER_INSTANCE_WHEN_ATTACHING_AD_RULES);
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
              position: playerRef.current?.getPosition(),
              reason: VAST_AD_NOT_USED.EXIT_PRE_POD,
              detail: AdMissedReason.AUTOPLAY,
            });
            return;
          }
          playerRef.current?.playAdResponse(ads);
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
  }, [playerRef]);

  const attachAdRules = useCallback(() => {
    // populate ad schedule when setting up ad playback
    adScheduleRef.current = makeAdSchedule(adBreaks);
    playerRef.current?.on(PLAYER_EVENTS.time, onTime);
  }, [playerRef, onTime, adBreaks]);

  const detachAdRules = useCallback(() => {
    playerRef.current?.removeListener(PLAYER_EVENTS.time, onTime);
  }, [playerRef, onTime]);

  return {
    isPrerollEnabled,
    trackNotUsedAds,
    getContentAdUrl,
    attachAdRules,
    detachAdRules,
    // returned only for testing
    adsDisabled,
    isAutomaticAutoplay,
  };
};
