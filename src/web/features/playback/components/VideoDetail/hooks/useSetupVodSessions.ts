import type { Player } from '@adrise/player';
import { reset } from '@adrise/player';
import { useCallback } from 'react';

import { hasPlaybackPageExitManager } from 'client/features/playback/services/PlaybackPageExitManager';
import {
  endVODSession,
  enterPage,
  resetVODPageSession,
} from 'client/features/playback/session/VODPageSession';
import type { VODPlaybackInfo } from 'client/features/playback/session/VODPlaybackSession';
import { VODPlaybackEvents, VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import {
  trackPlayerPageExit,
  trackVODPlayerServiceQuality,
} from 'client/features/playback/track/client-log';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useOnDecoupledPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnDecoupledPlayerCreate';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useLatest from 'common/hooks/useLatest';
import type { Video, VideoResource } from 'common/types/video';

interface UseSetupVodSessionsParams {
  video: Video;
  isFromAutoplay: boolean;
  isDeeplink: boolean;
  resumePosition: number;
  videoResource: VideoResource | undefined;
  trackNotUsedAds: VoidFunction;
  syncHistoryWithServer: (player: Player) => void;
  trackExitPictureInPicture: VoidFunction;
}

/**
 * Intended to encapsulate code that handles setting, reporting and cleaning up VOD Playback and VOD Page session
 */
export const useSetupVodSessions = ({
  video,
  isFromAutoplay,
  isDeeplink,
  resumePosition,
  videoResource,
  trackNotUsedAds,
  syncHistoryWithServer,
  trackExitPictureInPicture,
}: UseSetupVodSessionsParams) => {
  const dispatch = useAppDispatch();
  const { getPlayerInstance } = useGetPlayerInstance();

  const videoRef = useLatest(video);
  const videoResourceRef = useLatest(videoResource);
  const trackNotUsedAdsRef = useLatest(trackNotUsedAds);
  const syncHistoryWithServerRef = useLatest(syncHistoryWithServer);
  const trackExitPictureInPictureRef = useLatest(trackExitPictureInPicture);
  const isFromAutoplayRef = useLatest(isFromAutoplay);
  const isDeeplinkRef = useLatest(isDeeplink);
  const resumePositionRef = useLatest(resumePosition);

  const reportPlaybackSessionData = useCallback((retrievedPlaybackInfo?: VODPlaybackInfo) => {
    trackVODPlayerServiceQuality(retrievedPlaybackInfo);
  }, []);

  // Sync the reportPlaybackSessionData event listener to the lifecycle of the player
  useOnDecoupledPlayerCreate(useCallback(() => {
    const vodPlaybackSessionEventEmitter = VODPlaybackSession.getInstance().getEventEmitter();
    vodPlaybackSessionEventEmitter.on(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    return () => {
      vodPlaybackSessionEventEmitter.off(VODPlaybackEvents.reportPlaybackSessionData, reportPlaybackSessionData);
    };
  }, [reportPlaybackSessionData]), { preventRunOnMount: true });

  const onVODSessionStart = useCallback(() => {
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
  }, [
    isFromAutoplayRef,
    isDeeplinkRef,
    resumePositionRef,
    videoRef,
  ]);

  const onVODSessionEnd = useCallback(() => {
    const video = videoRef.current;
    const videoResource = videoResourceRef.current;
    const trackNotUsedAds = trackNotUsedAdsRef.current;
    const syncHistoryWithServer = syncHistoryWithServerRef.current;
    const trackExitPictureInPicture = trackExitPictureInPictureRef.current;

    // Must check this before end VOD session to ensure we send the player exit track
    const needToTrackPlayerExitInContainer = !hasPlaybackPageExitManager();

    const player = getPlayerInstance();

    // End the VOD session
    VODPlaybackSession.getInstance().endPlayback();
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

    // reset player state
    dispatch(reset());

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
    dispatch,
    getPlayerInstance,
    videoRef,
    videoResourceRef,
    trackNotUsedAdsRef,
    syncHistoryWithServerRef,
    trackExitPictureInPictureRef,
  ]);

  return { onVODSessionStart, onVODSessionEnd };
};
