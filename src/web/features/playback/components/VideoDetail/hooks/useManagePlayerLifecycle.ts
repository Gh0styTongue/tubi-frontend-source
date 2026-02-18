import type { AdError, AdErrorEventData, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { init } from '@adrise/player/lib/action';
import { useCallback, useEffect, useState } from 'react';

import { PlayerType, trackLeavePictureInPictureError } from 'client/features/playback/track/client-log';
import { trackAdError } from 'client/features/playback/track/client-log/trackAdError';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import { isCrawler } from 'client/utils/isCrawler';
import { getLocalCaptions, loadWebCustomCaptions, toggleWebCaptions } from 'common/actions/webCaptionSettings';
import * as eventTypes from 'common/constants/event-types';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import usePlayerEvent, { useDecoupledPlayerEvent } from 'common/features/playback/hooks/usePlayerEvent';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { useStableLayoutEffect } from 'common/hooks/useStableLayoutEffect';
import { useWebPlayerPipExperiment } from 'common/selectors/experiments/webPlayerPipSelector';
import { adBreaksByContentIdSelector } from 'common/selectors/video';
import type { Video, VideoResource } from 'common/types/video';
import { computeWebCaptionStyles } from 'common/utils/captionTools';
import { exitPictureInPicture, isPictureInPictureEnabled } from 'common/utils/pictureInPicture';
import { trackAppboyEvent } from 'common/utils/track';
import { useAds } from 'web/features/playback/components/VideoDetail/hooks/useAds';
import { useAttachAnalyticsEvents } from 'web/features/playback/components/VideoDetail/hooks/useAttachAnalyticsEvents';
import { useAttachGlobals } from 'web/features/playback/components/VideoDetail/hooks/useAttachGlobals';
import { useManageAutostart } from 'web/features/playback/components/VideoDetail/hooks/useManageAutostart';
import { useRemoveStartPositionQueryParam } from 'web/features/playback/components/VideoDetail/hooks/useRemoveStartPositionQueryParam';
import { useSetupAutoPlay } from 'web/features/playback/components/VideoDetail/hooks/useSetupAutoPlay';
import { useTrackVisualQualityChange } from 'web/features/playback/components/VideoDetail/hooks/useTrackVisualQualityChange';
import type { ShowAlertModal } from 'web/features/playback/components/VideoDetail/hooks/useVideoErrorModal';
import { useWatchHistory } from 'web/features/playback/components/VideoDetail/hooks/useWatchHistory';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';

import { useSetupVodSessions } from './useSetupVodSessions';

const NO_PLAYER_INSTANCE = 'No player instance in onPlayerCreate';

export interface UseManagePlayerLifecycle {
  video: Video;
  startPosition: number;
  showAlertModal: ShowAlertModal;
  isSafari: boolean;
  videoResourceManager: VideoResourceManager | undefined
  isContentReady: boolean
  videoResource: VideoResource | undefined;
  isFromAutoplay: boolean;
  isDeeplink: boolean;
}

export const useManagePlayerLifecycle = ({
  video,
  startPosition,
  showAlertModal,
  isSafari,
  videoResourceManager,
  isContentReady,
  videoResource,
  isFromAutoplay,
  isDeeplink,
}: UseManagePlayerLifecycle) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const dispatch = useAppDispatch();
  const [playerReady, setPlayerReady] = useState(false);
  const adBreaks = useAppSelector((state) => maybeOverrideCuePoints(adBreaksByContentIdSelector(state, video.id)));

  const isWebPipFeatureEnabled = useWebPlayerPipExperiment();
  const { setVODSessionHandlers } = usePlayerPortal();

  // useLatest invocations to allow for stable callbacks
  const videoRef = useLatest(video);
  const showAlertModalRef = useLatest(showAlertModal);

  // Callback to remove the start position query param from the URL
  useRemoveStartPositionQueryParam();

  // Figure out if we can autostart on this device
  const { getAutoStart, blockAutoStart } = useManageAutostart({ playerReady });
  const blockAutoStartRef = useLatest(blockAutoStart);

  // Expose playerRef to the window object for debugging purposes
  useAttachGlobals({ video });

  // Callbacks for handling watch history sync
  const { syncHistoryWithServer } = useWatchHistory({
    video,
  });

  // Callbacks for managing analytics events
  useAttachAnalyticsEvents({
    startPosition,
    video,
    videoResourceManager,
    isContentReady,
    videoResource,
  });

  useTrackVisualQualityChange({
    video,
    videoResourceManager,
    isContentReady,
    videoResource,
  });

  // Manage autoplay UI
  const { showAutoPlay } = useSetupAutoPlay({ video });

  // Set up ads
  const {
    isPrerollEnabled,
    trackNotUsedAds,
    getContentAdUrl,
  } = useAds({
    adBreaks,
    isFromAutoplay,
    video,
    isDeeplink,
    showAutoPlay,
  });

  /**
   * Render the video element immediately for crawlers
   */
  useEffect(() => {
    if (isCrawler()) {
      setPlayerReady(true);
    }
  }, []);

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

  /**
   * Destroys the player instance
   */
  const removePlayer = useCallback(() => {
    trackExitPictureInPicture();
    const player = getPlayerInstance();
    if (player) {
      player.remove();
    }

  }, [getPlayerInstance, trackExitPictureInPicture]);

  const onPlayerReady = useCallback(() => {
    if (!playerReady) {
      setPlayerReady(true);
    }
  }, [playerReady]);

  usePlayerEvent(PLAYER_EVENTS.setup, onPlayerReady, { once: true });

  // To handle setting player ready when returning to the same video page when in the player portal
  usePlayerEvent(PLAYER_EVENTS.time, onPlayerReady, { once: true });

  usePlayerEvent(PLAYER_EVENTS.adTime, onPlayerReady, { once: true });

  useDecoupledPlayerEvent(PLAYER_EVENTS.captionsChange, useCallback(({ captionsIndex }: { captionsIndex: number }) => {
    const player = getPlayerInstance();
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const captionsList = player.getCaptionsList();
    const { lang, label } = captionsList[captionsIndex];
    const language = lang || label;
    dispatch(toggleWebCaptions({
      ...(language.toLowerCase() !== 'off' ? { language } : {}),
      enabled: language.toLowerCase() !== 'off',
    }));
  }, [dispatch, getPlayerInstance]));

  useDecoupledPlayerEvent(PLAYER_EVENTS.adError, useCallback((error: AdError, { ad, adPosition, adsCount, adSequence, isPreroll, lagTime }: AdErrorEventData) => {
    const player = getPlayerInstance();
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const { id } = videoRef.current;
    const adInfo = {
      contentId: id,
      position: player.getPosition(),
      url: ad?.video,
      id: ad?.id,
      duration: ad?.duration,
      index: adSequence,
      count: adsCount,
      adPosition,
      isPreroll,
      player: PlayerType.VOD,
      lagTime,
    };
    trackAdError(error, adInfo);

    logger.error({ err: error, contentId: id }, 'Web player ad error');

    if (error && error.name && (error.name === 'NotAllowedError')) {
      blockAutoStartRef.current();
    }

  }, [blockAutoStartRef, videoRef, getPlayerInstance]));

  useDecoupledPlayerEvent(PLAYER_EVENTS.play, useCallback(() => {
    trackAppboyEvent(eventTypes.APPBOY_START_VIDEO);
  }, []));

  /**
   * Subscribe to player creation
   */
  const startPositionRef = useLatest(startPosition);

  // We strictly only want to run this when a player is created in order to avoid running it
  // when returning to the same video page when in the player portal
  useOnPlayerCreate(useCallback((player: InstanceType<typeof Player>) => {
    const { duration } = videoRef.current;
    dispatch(init(player, startPositionRef.current, duration));
  }, [dispatch, videoRef, startPositionRef]), { preventRunOnMount: true });

  const onPlayerCreate = useCallback((player: InstanceType<typeof Player>, playerManagers?: PlayerManagers) => {

    const errorManager = playerManagers?.errorManager;
    if (errorManager) {
      errorManager.setShowModal(showAlertModalRef.current);
    }

    const captionSettingsFromStorage = getLocalCaptions();
    if (captionSettingsFromStorage) {
      dispatch(loadWebCustomCaptions(captionSettingsFromStorage));
      player.setCaptionsStyles(computeWebCaptionStyles(JSON.parse(captionSettingsFromStorage)));
    }
  }, [
    dispatch,
    showAlertModalRef,
  ]);
  useOnPlayerCreate(onPlayerCreate);

  const { onVODSessionStart, onVODSessionEnd } = useSetupVodSessions({
    isFromAutoplay,
    isDeeplink,
    resumePosition: startPosition,
    video,
    videoResource,
    trackNotUsedAds,
    syncHistoryWithServer,
    trackExitPictureInPicture,
  });

  const contentIdRef = useLatest(video.id);
  useStableLayoutEffect(useCallback(() => {
    /**
     * When the in-app PiP feature is enabled, the player can persist across multiple pages.
     * In this case, we defer the VOD session start and end handlers to the player portal context,
     * allowing them to be managed independently of the VideoDetail page lifecycle.
     * If the PiP feature is not enabled, we invoke the handlers directly in sync
     * with the VideoDetail page's mount and unmount.
    */
    if (!isWebPipFeatureEnabled) {
      onVODSessionStart();
      return () => {
        onVODSessionEnd();
      };
    }

    setVODSessionHandlers(contentIdRef.current, {
      onStart: onVODSessionStart,
      onEnd: onVODSessionEnd,
    });
  }, [
    contentIdRef,
    isWebPipFeatureEnabled,
    onVODSessionStart,
    onVODSessionEnd,
    setVODSessionHandlers,
  ]));

  return { removePlayer, playerReady, blockAutoStart, getAutoStart, isPrerollEnabled, getContentAdUrl, showAutoPlay };
};
