import type { AdError, AdErrorEventData, DrmKeySystem, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { init, reset } from '@adrise/player/lib/action';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { hasPlaybackPageExitManager } from 'client/features/playback/services/PlaybackPageExitManager';
import { endVODSession, resetVODPageSession } from 'client/features/playback/session/VODPageSession';
import type { VODPlaybackInfo } from 'client/features/playback/session/VODPlaybackSession';
import { VODPlaybackEvents, VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { PlayerType, trackLeavePictureInPictureError, trackPlayerPageExit } from 'client/features/playback/track/client-log';
import { trackAdError } from 'client/features/playback/track/client-log/trackAdError';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { isCrawler } from 'client/utils/isCrawler';
import { getLocalCaptions, loadWebCustomCaptions, toggleWebCaptions } from 'common/actions/webCaptionSettings';
import * as eventTypes from 'common/constants/event-types';
import type WebRepositionVideoResource from 'common/experiments/config/webRepositionVideoResource';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useLatest from 'common/hooks/useLatest';
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
import { getVideoResource } from 'web/features/playback/components/VideoDetail/utils/getVideoResource';

const NO_PLAYER_INSTANCE = 'No player instance in onPlayerCreate';

export interface UseManagePlayerLifecycle {
  video: Video;
  playerRef: React.MutableRefObject<Player | null>;
  isLoggedIn: boolean;
  startPosition: number;
  showAlertModal: ShowAlertModal;
  isSafari: boolean;
  webRepositionVideoResource: ReturnType<typeof WebRepositionVideoResource>;
  drmKeySystem: DrmKeySystem | undefined;
  isDRMSupported: boolean
  videoResourceManagerOldPosition: VideoResourceManager | undefined
  isContentReady: boolean
  videoResourceOldPosition: VideoResource | undefined;
  reportPlaybackSessionData: (retrievedPlaybackInfo?: VODPlaybackInfo) => void;
  adBreaks: number[];
  isFromAutoplay: boolean;
  isDeeplink: boolean;
}

export const useManagePlayerLifecycle = ({
  video,
  playerRef,
  isLoggedIn,
  startPosition,
  showAlertModal,
  isSafari,
  webRepositionVideoResource,
  drmKeySystem,
  isDRMSupported,
  videoResourceManagerOldPosition,
  isContentReady,
  videoResourceOldPosition,
  reportPlaybackSessionData,
  adBreaks,
  isFromAutoplay,
  isDeeplink,
}: UseManagePlayerLifecycle) => {
  const dispatch = useAppDispatch();
  const [playerReady, setPlayerReady] = useState(false);

  // Callback to remove the start position query param from the URL
  const { removeStartPositionQueryParam } = useRemoveStartPositionQueryParam();

  // Figure out if we can autostart on this device
  const { getAutoStart, blockAutoStart } = useManageAutostart({ playerReady });

  // Expose playerRef to the window object for debugging purposes
  const { attachGlobals } = useAttachGlobals({ playerRef, video });

  // Callbacks for handling watch history sync
  const { attachHistoryHandler, syncHistoryWithServer } = useWatchHistory({
    video,
  });

  // Callbacks for managing analytics events
  const { attachAnalyticsEvents, detachAnalyticsEvents } = useAttachAnalyticsEvents({
    startPosition,
    video,
    videoResourceManagerOldPosition,
    isContentReady,
    videoResourceOldPosition,
  });

  // Callback for tracking quality changes
  const { onVisualQualityChange } = useTrackVisualQualityChange({
    video,
    playerRef,
    videoResourceManagerOldPosition,
    isContentReady,
    videoResourceOldPosition,
  });

  // Manage autoplay UI
  const { showAutoPlay, attachAutoPlay, detachAutoPlay } = useSetupAutoPlay({ video });

  // Set up ads
  const {
    isPrerollEnabled, trackNotUsedAds, getContentAdUrl, attachAdRules, detachAdRules,
  } = useAds({
    adBreaks, playerRef, isFromAutoplay, video, isDeeplink, showAutoPlay,
  });

  /**
   * Render the video element immediately for crawlers
   */
  useEffect(() => {
    if (isCrawler()) {
      setPlayerReady(true);
    }
  }, []);

  /**
   * Destroys the player instance
   */
  const removePlayer = useCallback(() => {
    const { id } = video;

    // In Safari, we cannot auto-enable picture-in-picture with javascript, this make us unable to preserve pip status across autoplay contents
    // We need to exit pip manually when unmounting the player in Safari
    if (isPictureInPictureEnabled() && isSafari) {
      exitPictureInPicture().catch((error: DOMException) => {
        trackLeavePictureInPictureError(id, error.message);
      });
    }

    if (playerRef.current) {
      playerRef.current.remove();
      playerRef.current = null;
    }

  }, [isSafari, video, playerRef]);

  /**
   * Intended to be called when the player is created
   */
  const onPlayerCreate = useCallback((player: InstanceType<typeof Player>, playerManagers?: PlayerManagers) => {
    const { id, duration } = video;

    playerRef.current = player;

    dispatch(init(player, startPosition, duration));

    attachHistoryHandler(player);

    attachAnalyticsEvents(player);

    const errorManager = playerManagers?.errorManager;
    if (errorManager) {
      errorManager.setShowModal(showAlertModal);
    }

    player.once(PLAYER_EVENTS.setup, () => setPlayerReady(true));

    player.on(PLAYER_EVENTS.captionsChange, ({ captionsIndex }: {captionsIndex: number}) => {
      if (!playerRef.current) throw new Error(NO_PLAYER_INSTANCE);
      const captionsList = playerRef.current.getCaptionsList();
      const { lang, label } = captionsList[captionsIndex];

      const language = lang || label;
      dispatch(toggleWebCaptions({
        ...(language.toLowerCase() !== 'off' ? { language } : {}),
        enabled: language.toLowerCase() !== 'off',
      }));
    });

    attachAutoPlay(player);

    attachAdRules();

    player.on(PLAYER_EVENTS.visualQualityChange, onVisualQualityChange);

    player.on(PLAYER_EVENTS.adError, (error: AdError, { ad, adPosition, adsCount, adSequence, isPreroll, lagTime }: AdErrorEventData) => {
      if (!playerRef.current) throw new Error(NO_PLAYER_INSTANCE);
      const adInfo = {
        contentId: id,
        position: playerRef.current.getPosition(),
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
        blockAutoStart();
      }
    });

    // track appboy event
    player.on(PLAYER_EVENTS.play, () => {
      trackAppboyEvent(eventTypes.APPBOY_START_VIDEO);
    });

    const captionSettingsFromStorage = getLocalCaptions();
    if (captionSettingsFromStorage) {
      dispatch(loadWebCustomCaptions(captionSettingsFromStorage));
      player.setCaptionsStyles(computeWebCaptionStyles(JSON.parse(captionSettingsFromStorage)));
    }
    if (!isLoggedIn) removeStartPositionQueryParam();

    attachGlobals();

  }, [
    video,
    playerRef,
    attachHistoryHandler,
    attachAnalyticsEvents,
    dispatch,
    startPosition,
    showAlertModal,
    setPlayerReady,
    attachAdRules,
    attachAutoPlay,
    blockAutoStart,
    onVisualQualityChange,
    removeStartPositionQueryParam,
    attachGlobals,
    isLoggedIn,
  ]);

  /**
   * These useLatest invocations exist to help us ensure that the useEffect
   * cleanup function has the most up-to-date values of these variables
   * while ensuring it can only run on unmount
   */
  const videoRef = useLatest(video);
  const webRepositionVideoResourceRef = useLatest(webRepositionVideoResource);
  const drmKeySystemRef = useLatest(drmKeySystem);
  const isDRMSupportedRef = useLatest(isDRMSupported);
  const videoResourceManagerFromPropsRef = useLatest(videoResourceManagerOldPosition);
  const isContentReadyRef = useLatest(isContentReady);
  const videoResourceFromPropsRef = useLatest(videoResourceOldPosition);
  const reportPlaybackSessionDataRef = useLatest(reportPlaybackSessionData);
  const trackNotUsedAdsRef = useLatest(trackNotUsedAds);
  const syncHistoryWithServerRef = useLatest(syncHistoryWithServer);
  const detachAutoPlayRef = useLatest(detachAutoPlay);
  const detachAdRulesRef = useLatest(detachAdRules);
  const detachAnalyticsEventsRef = useLatest(detachAnalyticsEvents);
  const removePlayerRef = useLatest(removePlayer);

  /**
   * This effect is responsible for unmounting and destroying the player instance
   * when the hook unmounts. Migrated from componentWillUnmount in the old
   * VideoDetail class component
   *
   * Why do we use `useLayoutEffect` here? See https://github.com/adRise/www/pull/23652
   * for a detailed explanation. In short: we need to ensure that the cleanup
   * function runs synchronously as soon as conditions are met for it to run,
   * rather than it merely being scheduled by React to run at some point in the
   * future. If we don't do this, it can result in bugs related to the user
   * navigating to new content, in which onPlayerCreate ends up running for the
   * new player instance _prior_ to the cleanup function running for the old
   * player instance.
   *
   * We can safely replace useLayoutEffect with useEffect in the future here
   * if we can guarantee that onPlayerCreate will be invoked with the player
   * even if the player is created prior to VideoDetail (re)mounting after a
   * re-render. Be sure to test what happens when the user navigates via YMAL
   * or autoplay.
   *
   */
  useLayoutEffect(() => {
    return () => {
      // We ignore the hook lint rules here because we know we can access
      // the latest values from the refs. We intentionally shadow the variables
      // in the outer scope.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const video = videoRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const webRepositionVideoResource = webRepositionVideoResourceRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const drmKeySystem = drmKeySystemRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const isDRMSupported = isDRMSupportedRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoResourceManagerFromProps = videoResourceManagerFromPropsRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const isContentReady = isContentReadyRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const videoResourceFromProps = videoResourceFromPropsRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const reportPlaybackSessionData = reportPlaybackSessionDataRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const trackNotUsedAds = trackNotUsedAdsRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const syncHistoryWithServer = syncHistoryWithServerRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const detachAutoPlay = detachAutoPlayRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const detachAdRules = detachAdRulesRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const detachAnalyticsEvents = detachAnalyticsEventsRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const removePlayer = removePlayerRef.current;

      const videoResource = getVideoResource({
        webRepositionVideoResource,
        video,
        drmKeySystem,
        isDRMSupported,
        videoResourceManager: videoResourceManagerFromProps,
        isContentReady,
        videoResource: videoResourceFromProps,
      });

      // Must check this before end VOD session to ensure we send the player exit track
      const needToTrackPlayerExitInContainer = !hasPlaybackPageExitManager();

      // End the VOD session
      VODPlaybackSession.getInstance().endPlayback();
      endVODSession();
      VODPlaybackSession.getInstance().getEventEmitter().off(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);

      if (needToTrackPlayerExitInContainer && videoResource) {
        trackPlayerPageExit({
          contentId: video.id,
          videoResource,
          player: playerRef.current ?? undefined,
        });
      }

      // only cleanup document listeners when unmount
      trackNotUsedAds();

      // reset player state
      dispatch(reset());

      // this is a typeguard for syncHistoryWithServer
      // but note that it also prevents calling a number of other functions
      // if the player is gone already
      if (!playerRef.current) return;
      syncHistoryWithServer(playerRef.current);

      // detach events
      detachAutoPlay(playerRef.current);
      detachAdRules();
      detachAnalyticsEvents();

      // destroy player
      removePlayer();

      // reset VOD playback session
      VODPlaybackSession.getInstance().resetPlaybackInfo();
      resetVODPageSession();
    };
  },
  // Everything here needs to be a ref, or we risk the cleanup function
  // not running only on unmount if any of these values change
  [
    videoRef,
    webRepositionVideoResourceRef,
    drmKeySystemRef,
    isDRMSupportedRef,
    // not a ref but known to be stable
    dispatch,
    videoResourceManagerFromPropsRef,
    isContentReadyRef,
    videoResourceFromPropsRef,
    playerRef,
    reportPlaybackSessionDataRef,
    trackNotUsedAdsRef,
    syncHistoryWithServerRef,
    detachAutoPlayRef,
    detachAdRulesRef,
    detachAnalyticsEventsRef,
    removePlayerRef,
  ]);

  return { onPlayerCreate, removePlayer, playerReady, blockAutoStart, getAutoStart, isPrerollEnabled, getContentAdUrl, showAutoPlay };
};
