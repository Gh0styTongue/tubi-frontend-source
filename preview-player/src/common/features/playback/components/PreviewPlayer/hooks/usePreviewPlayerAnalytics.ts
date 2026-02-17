import type { ErrorEventData, Player, Progress, StartupPerformanceEventData } from '@adrise/player';
import { PLAYER_EVENTS, State } from '@adrise/player';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trackPreviewError } from 'client/features/playback/track/client-log/trackPreviewError';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { FINISH_PREVIEW, PREVIEW_PLAY_PROGRESS, START_PREVIEW } from 'common/constants/event-types';
import { useLocation, useParams } from 'common/context/ReactRouterModernContext';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import { useViewTimeManager } from 'common/features/playback/hooks/useViewTimeManager';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { usePrevious } from 'common/hooks/usePrevious';
import useUnmount from 'common/hooks/useUnmount';
import trackingManager from 'common/services/TrackingManager';
import { VideoPlayerPageType } from 'common/services/TrackingManager/type';
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

function usePreviewPlayerAnalytics({
  player,
  videoPlayerState,
  loop,
  isReusable,
}: UsePreviewPlayerAnalyticsProps) {
  const location = useLocation();
  const params = useParams();
  const video = useAppSelector((state) => contentSelector(state, { location, params }));
  const page = useAppSelector((state) => videoPlayerPageSelector(state, { location, params }));
  const previewUrl = useAppSelector((state) => previewSelector(state, { location, params }));
  const previousPreviewUrl = usePrevious(previewUrl);
  const contentId = useRef(video.id);
  const isMuted = useAppSelector(state => state.player.videoPreviewMuted);

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
    trackingManager.trackStartPreviewEvent({
      contentId: video.id,
      videoPlayer: latestVideoPlayerState.current,
      page,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = START_PREVIEW;
  }, [video.id, latestVideoPlayerState, page, getCategorySlug]);

  const onVideoStart = useCallback(() => {
    totalTimeToFirstFrame.current = Date.now() - loadStartTime.current;
    reportPreviewStartEvent();
  }, [reportPreviewStartEvent]);

  const reportPreviewPlayProgressEvent = useCallback((position: number, viewTime: number) => {
    totalTimeToFirstFrame.current = Date.now() - loadStartTime.current;
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW) return;
    trackingManager.trackPreviewPlayProgressEvent({
      contentId: video.id,
      position,
      viewTime,
      videoPlayer: latestVideoPlayerState.current,
      page,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = PREVIEW_PLAY_PROGRESS;
  }, [video.id, latestVideoPlayerState, page, getCategorySlug]);

  const reportPreviewFinishEvent = useCallback((hasCompleted: boolean = hasLooped) => {
    if (lastReportedAnalyticEvent.current === FINISH_PREVIEW) return;
    trackingManager.trackFinishPreviewEvent({
      contentId: contentId.current,
      position: prevPosition.current || 0,
      page,
      videoPlayer: latestVideoPlayerState.current,
      hasCompleted: !!hasCompleted,
      slug: getCategorySlug(page),
    });
    lastReportedAnalyticEvent.current = FINISH_PREVIEW;
    setHasLooped(false);
  }, [latestVideoPlayerState, getCategorySlug, page, hasLooped]);

  const onVideoTime = useCallback(({ position }: Progress) => {
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

  const onPlayerRemove = useCallback(() => {
    // Check player state to prevent reporting finish event twice
    if (player && player.getState() !== State.completed) {
      reportPreviewFinishEvent();
    }
  }, [player, reportPreviewFinishEvent]);

  // To report when navigating into player page
  useUnmount(reportPreviewFinishEvent);

  useViewTimeManager({
    player,
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

  /**
   * Player event listeners
   */
  usePlayerEvent(PLAYER_EVENTS.startupPerformance, reportStartupPerformance, player);
  usePlayerEvent(PLAYER_EVENTS.firstFrame, onVideoStart, player, { disable: lastReportedAnalyticEvent.current !== FINISH_PREVIEW });
  usePlayerEvent(PLAYER_EVENTS.time, onVideoTime, player);
  usePlayerEvent(PLAYER_EVENTS.complete, onVideoComplete, player);
  usePlayerEvent(PLAYER_EVENTS.error, onVideoError, player);
  usePlayerEvent(PLAYER_EVENTS.remove, onPlayerRemove, player);
}

export default usePreviewPlayerAnalytics;
