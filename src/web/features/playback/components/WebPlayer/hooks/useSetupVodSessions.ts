import { PLAYER_EVENTS, reset, sendVASTNotUsedBeacon, VAST_AD_NOT_USED } from '@adrise/player';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import type { Location } from 'history';
import { useCallback } from 'react';

import { hasPlaybackPageExitManager } from 'client/features/playback/services/PlaybackPageExitManager';
import {
  endVODSession,
  enterPage,
  getVODPageSession,
  resetVODPageSession,
} from 'client/features/playback/session/VODPageSession';
import type { VODPlaybackInfo } from 'client/features/playback/session/VODPlaybackSession';
import { VODPlaybackEvents, VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import {
  trackAdBeaconFailed,
  trackLeavePictureInPictureError,
  trackPlayerPageExit,
  trackVODPlayerServiceQuality,
} from 'client/features/playback/track/client-log';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useGetPlayerManagers } from 'common/features/playback/context/playerContext/hooks/useGetPlayerManagers';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { useStableLayoutEffect } from 'common/hooks/useStableLayoutEffect';
import { userAgentSelector } from 'common/selectors/ui';
import type { Video } from 'common/types/video';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import { exitPictureInPicture, isPictureInPictureEnabled } from 'common/utils/pictureInPicture';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';
import { getIsFromAutoplay } from 'web/features/playback/utils/getIsFromAutoplay';

import { useGetStartPosition } from './useGetStartPosition';
import { useWatchHistory } from './useWatchHistory';
interface UseSetupVodSessionsParams {
  video: Video;
  location: Location;
  resumePosition: number;
}

/**
 * Intended to encapsulate code that handles setting, reporting and cleaning up VOD Playback and VOD Page session
 */
export const useSetupVodSessions = ({
  video,
  location,
  resumePosition,
}: UseSetupVodSessionsParams) => {
  const dispatch = useAppDispatch();
  const { getPlayerInstance } = useGetPlayerInstance();
  const { getPlayerManagers } = useGetPlayerManagers();
  const isFromAutoplay = getIsFromAutoplay(location.query);
  const isDeeplink = isDeepLinkOnWeb(location.query);

  const { startPosition: startPositionFromStore } = useGetStartPosition({ contentId: video.id, location });
  const startPosition = resumePosition || startPositionFromStore;

  const videoRef = useLatest(video);
  const isFromAutoplayRef = useLatest(isFromAutoplay);
  const isDeeplinkRef = useLatest(isDeeplink);
  const resumePositionRef = useLatest(startPosition);
  const userAgent = useAppSelector(userAgentSelector);
  const isSafari = userAgent?.browser?.name === 'Safari';

  const { isFloating } = usePlayerPortal();
  const isFloatingRef = useLatest(isFloating);
  const reportPlaybackSessionData = useCallback((retrievedPlaybackInfo?: VODPlaybackInfo) => {
    trackVODPlayerServiceQuality(retrievedPlaybackInfo);
  }, []);

  /**
   * Callback for syncing watch history with the server
   */
  const { syncHistoryWithServer } = useWatchHistory({
    video,
    location,
  });
  const syncHistoryWithServerRef = useLatest(syncHistoryWithServer);

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
  const trackNotUsedAdsRef = useLatest(trackNotUsedAds);

  /**
   * Callback for tracking exiting picture-in-picture
   */
  const trackExitPictureInPicture = useCallback(() => {
    // In Safari, we cannot auto-enable picture-in-picture with javascript, this make us unable to preserve pip status across autoplay contents
    // We need to exit pip manually when unmounting the player in Safari
    if (isPictureInPictureEnabled() && isSafari) {
      const { id } = video;
      exitPictureInPicture().catch((error: DOMException) => {
        trackLeavePictureInPictureError(id, error.message);
      });
    }
  }, [video, isSafari]);
  const trackExitPictureInPictureRef = useLatest(trackExitPictureInPicture);

  const onVODSessionStart = useCallback(() => {
    if (getVODPageSession().stage !== 'NONE') return;
    resetVODPageSession();
    enterPage({
      isAutomaticAutoplay: false,
      contentId: videoRef.current.id,
      isDeeplink: isDeeplinkRef.current,
    });
    VODPlaybackSession.getInstance().startPlayback({
      isSeries: !!videoRef.current.series_id,
      contentId: videoRef.current.id,
      isAutoplay: isFromAutoplayRef.current,
      isContinueWatching: resumePositionRef.current > 0,
      isDeeplink: isDeeplinkRef.current,
    });
    const vodPlaybackSessionEventEmitter = VODPlaybackSession.getInstance().getEventEmitter();
    vodPlaybackSessionEventEmitter.off(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    vodPlaybackSessionEventEmitter.on(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    VODPlaybackSession.getInstance().setPlayerDisplayMode(isFloatingRef.current ? PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE : PlayerDisplayMode.DEFAULT);
  }, [
    isFromAutoplayRef,
    isDeeplinkRef,
    resumePositionRef,
    videoRef,
    reportPlaybackSessionData,
    isFloatingRef,
  ]);

  const onVODSessionEnd = useCallback(() => {
    if (getVODPageSession().stage === 'NONE') return;
    const player = getPlayerInstance();
    const playerManagers = getPlayerManagers();

    const video = videoRef.current;
    const videoResource = playerManagers?.videoResourceManagerV2?.getCurrentResource();
    const trackNotUsedAds = trackNotUsedAdsRef.current;
    const syncHistoryWithServer = syncHistoryWithServerRef.current;
    const trackExitPictureInPicture = trackExitPictureInPictureRef.current;

    // Must check this before end VOD session to ensure we send the player exit track
    const needToTrackPlayerExitInContainer = !hasPlaybackPageExitManager();

    // End the VOD session
    VODPlaybackSession.getInstance().endPlayback();
    VODPlaybackSession.getInstance().getEventEmitter().off(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    endVODSession();

    if (needToTrackPlayerExitInContainer && videoResource) {
      trackPlayerPageExit({
        contentId: video.id,
        videoResource,
        player,
      });
    }

    // only cleanup document listeners when unmount
    trackNotUsedAds();

    trackExitPictureInPicture();

    // reset VOD playback session
    VODPlaybackSession.getInstance().resetPlaybackInfo();
    resetVODPageSession();

    // this is a typeguard for syncHistoryWithServer
    if (player) {
      syncHistoryWithServer(player);
    }

  // Everything here needs to be a ref, or we risk the cleanup function
  // not running only on unmount if any of these values change
  }, [
    getPlayerInstance,
    videoRef,
    trackNotUsedAdsRef,
    syncHistoryWithServerRef,
    trackExitPictureInPictureRef,
    reportPlaybackSessionData,
    getPlayerManagers,
  ]);

  usePlayerEvent(PLAYER_EVENTS.remove, useCallback(() => {
    dispatch(reset());
  }, [dispatch]));

  useStableLayoutEffect(useCallback(() => {
    onVODSessionStart();
    return () => {
      onVODSessionEnd();
    };
  }, [
    onVODSessionStart,
    onVODSessionEnd,
  ]));
};
