import type { ErrorEventData, Player, Progress, StartupPerformanceEventData } from '@adrise/player';
import { PLAYER_EVENTS, State } from '@adrise/player';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { trackPreviewError } from 'client/features/playback/track/client-log/trackPreviewError';
import { ANALYTICS_COMPONENTS } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { FINISH_PREVIEW, PREVIEW_PLAY_PROGRESS, START_PREVIEW } from 'common/constants/event-types';
import { useLocation, useParams } from 'common/context/ReactRouterModernContext';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import { useRerenderWhenPlayerReady } from 'common/features/playback/context/playerContext/hooks/useRerenderWhenPlayerReady';
import { useViewTimeManager } from 'common/features/playback/hooks/useViewTimeManager';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { usePrevious } from 'common/hooks/usePrevious';
import useUnmount from 'common/hooks/useUnmount';
import { ottSideMenuSelector } from 'common/selectors/container';
import { playerStateSelector } from 'common/selectors/playerStore';
import trackingManager from 'common/services/TrackingManager';
import type { CommonPreviewParams } from 'common/services/TrackingManager/type';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
import type { Video } from 'common/types/video';
import { getPageObjectFromURL } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackLogging } from 'common/utils/track';
import { contentSelector, previewSelector, videoPlayerPageSelector } from 'ott/features/playback/selectors/vod';

interface UsePreviewPlayerAnalyticsProps {
  player?: Player;
  videoPlayerState: PlayerDisplayMode;
  loop?: boolean;
  isReusable?: boolean;
}

export const getPreviewId = (video: Video) => {
  return video.video_previews?.find(p => p.url === video.video_preview_url)?.uuid;
};

function usePreviewPlayerAnalytics({
  videoPlayerState,
  loop,
  isReusable,
}: UsePreviewPlayerAnalyticsProps) {
  // TODO: attempt to eliminate the need for this hook
  // which triggers a (theoretically) unnecessary re-render when the player is ready
  const { player } = useRerenderWhenPlayerReady();

  const location = useLocation();
  const { pathname } = location;
  const params = useParams();
  const video = useAppSelector((state) => contentSelector(state, { location, params }));
  const page = useAppSelector((state) => videoPlayerPageSelector(state, { location, params }));
  const previewUrl = useAppSelector((state) => previewSelector(state, { location, params }));
  const previousPreviewUrl = usePrevious(previewUrl);
  const commonPreviewParams = useRef<CommonPreviewParams>();
  const isMuted = useAppSelector(state => state.player.videoPreviewMuted);
  const activeContainerId = useAppSelector(state => state.fire?.containerUI.containerId);
  const x = useAppSelector(state => state.ui.containerIndexMap[activeContainerId] ?? 0);
  const y = useAppSelector(state => ottSideMenuSelector(state, { pathname }).findIndex(c => c.id === activeContainerId));
  const matrix = useMemo(() => ({
    // add 1 because analytics expects 1..n instead of 0..n
    startX: x + 1,
    startY: y + 1,
  }), [x, y]);

  const loadStartTime = useRef(0);
  const totalTimeToFirstFrame = useRef(0);
  const lastReportedAnalyticEvent = useRef(FINISH_PREVIEW);
  const prevPosition = useRef(player?.getPosition());
  const [hasLooped, setHasLooped] = useState(false);

  const latestVideoPlayerState = useLatest(videoPlayerState);

  const getCategorySlug = useCallback((page: VideoPlayerPageType) => {
    const pageObj = getPageObjectFromURL(getCurrentPathname());
    if (__ISOTT__ && page === VideoPlayerPageType.CATEGORY_PAGE && pageObj && 'category_page' in pageObj) {
      return pageObj.category_page.category_slug;
    }
    return '';
  }, []);

  const reportStartupPerformance = useCallback(({ metrics }: StartupPerformanceEventData) => {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.PREVIEW_PERFORMANCE_METRIC,
      message: {
        content_id: video.id,
        metrics,
        total_time_to_first_frame: totalTimeToFirstFrame.current,
      },
    });
  }, [video.id]);

  const reportPreviewStartEvent = useCallback(() => {
    if (lastReportedAnalyticEvent.current !== FINISH_PREVIEW) return;
    commonPreviewParams.current = {
      contentId: video.id,
      previewId: getPreviewId(video),
      slug: getCategorySlug(page),
      matrix,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
      containerSlug: activeContainerId,
    };
    trackingManager.trackStartPreviewEvent({
      ...commonPreviewParams.current,
      videoPlayer: latestVideoPlayerState.current,
      page,
    });
    lastReportedAnalyticEvent.current = START_PREVIEW;
  }, [video, latestVideoPlayerState, page, getCategorySlug, matrix, activeContainerId]);

  const onVideoStart = useCallback(() => {
    totalTimeToFirstFrame.current = Date.now() - loadStartTime.current;
    reportPreviewStartEvent();
  }, [reportPreviewStartEvent]);

  const reportPreviewPlayProgressEvent = useCallback((position: number, viewTime: number) => {
    totalTimeToFirstFrame.current = Date.now() - loadStartTime.current;
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW || !commonPreviewParams.current) return;
    trackingManager.trackPreviewPlayProgressEvent({
      ...commonPreviewParams.current,
      position,
      viewTime,
      videoPlayer: latestVideoPlayerState.current,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
      page,
    });
    lastReportedAnalyticEvent.current = PREVIEW_PLAY_PROGRESS;
  }, [latestVideoPlayerState, page]);

  const reportPreviewFinishEvent = useCallback((hasCompleted: boolean = hasLooped) => {
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW || !commonPreviewParams.current) return;
    trackingManager.trackFinishPreviewEvent({
      ...commonPreviewParams.current,
      position: prevPosition.current || 0,
      videoPlayer: latestVideoPlayerState.current,
      hasCompleted: !!hasCompleted,
      page,
    });
    lastReportedAnalyticEvent.current = FINISH_PREVIEW;
    setHasLooped(false);
    commonPreviewParams.current = undefined;
  }, [latestVideoPlayerState, hasLooped, page]);

  const onVideoTime = useCallback(({ position }: Progress) => {
    // TODO: we can remove the mechanism in this component which tracks progress
    /* istanbul ignore next */
    if (position === undefined) return;

    const nowPosition = Math.floor(position);
    if (nowPosition !== prevPosition.current) {
      prevPosition.current = nowPosition;
    }
  }, []);

  const onVideoError = useCallback((error: ErrorEventData) => {
    trackPreviewError(error, {
      contentId: video.id,
      videoPlayerState,
      isMuted,
    });
  }, [isMuted, video.id, videoPlayerState]);

  const onVideoComplete = useCallback(() => {
    if (loop) {
      setHasLooped(true);
      return;
    }
    reportPreviewFinishEvent(true);
  }, [loop, reportPreviewFinishEvent]);

  const playerStateRef = useLatest(useAppSelector(playerStateSelector));

  const onPlayerRemove = useCallback(() => {
    // Check player state to prevent reporting finish event twice
    if (playerStateRef.current !== State.completed) {
      reportPreviewFinishEvent();
    }
  }, [reportPreviewFinishEvent, playerStateRef]);

  // To report when navigating into player page
  useUnmount(reportPreviewFinishEvent);

  useViewTimeManager({
    track: reportPreviewPlayProgressEvent,
  });

  useEffect(() => {
    if (previewUrl) {
      loadStartTime.current = Date.now();
    }
  }, [previewUrl]);

  // Report preview finish event when previewUrl changes and isReusable is true
  useEffect(() => {
    if (isReusable && previousPreviewUrl && previousPreviewUrl !== previewUrl) {
      reportPreviewFinishEvent();
    }
  }, [isReusable, previousPreviewUrl, previewUrl, reportPreviewFinishEvent]);

  const reportStartupPerformanceRef = useLatest(reportStartupPerformance);
  const onVideoStartRef = useLatest(onVideoStart);
  const onVideoTimeRef = useLatest(onVideoTime);
  const onVideoCompleteRef = useLatest(onVideoComplete);
  const onVideoErrorRef = useLatest(onVideoError);
  const onPlayerRemoveRef = useLatest(onPlayerRemove);

  useOnPlayerCreate(
    useCallback(
      (player) => {

        const reportStartupPerformance = reportStartupPerformanceRef.current;
        const onVideoStart = onVideoStartRef.current;
        const onVideoTime = onVideoTimeRef.current;
        const onVideoComplete = onVideoCompleteRef.current;
        const onVideoError = onVideoErrorRef.current;
        const onPlayerRemove = onPlayerRemoveRef.current;

        player.on(PLAYER_EVENTS.startupPerformance, reportStartupPerformance);
        player.on(PLAYER_EVENTS.firstFrame, onVideoStart);
        player.on(PLAYER_EVENTS.time, onVideoTime);
        player.on(PLAYER_EVENTS.complete, onVideoComplete);
        player.on(PLAYER_EVENTS.error, onVideoError);
        player.on(PLAYER_EVENTS.remove, onPlayerRemove);

        return () => {
          player.off(PLAYER_EVENTS.startupPerformance, reportStartupPerformance);
          player.off(PLAYER_EVENTS.firstFrame, onVideoStart);
          player.off(PLAYER_EVENTS.time, onVideoTime);
          player.off(PLAYER_EVENTS.complete, onVideoComplete);
          player.off(PLAYER_EVENTS.error, onVideoError);
          player.off(PLAYER_EVENTS.remove, onPlayerRemove);
        };
      },
      [
        reportStartupPerformanceRef,
        onVideoStartRef,
        onVideoTimeRef,
        onVideoCompleteRef,
        onVideoErrorRef,
        onPlayerRemoveRef,
      ]
    )
  );
}

export default usePreviewPlayerAnalytics;
