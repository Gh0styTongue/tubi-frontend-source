import type {
  Player, StartupPerformanceEventData } from '@adrise/player';
import { PLAYER_EVENTS,
} from '@adrise/player';
import { VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useMemo, useRef } from 'react';

import { trackAdStartupPerformance } from 'client/features/playback/track/client-log/trackAdStartupPerformance';
import { trackContentStartupPerformance } from 'client/features/playback/track/client-log/trackContentStartupPerformance';
import { trackPlayerPerformanceMetrics } from 'client/features/playback/track/datadog';
import * as eventTypes from 'common/constants/event-types';
import WebRepositionVideoResource from 'common/experiments/config/webRepositionVideoResource';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getFormatResolution } from 'common/features/playback/utils/getFormatResolution';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import useLatest from 'common/hooks/useLatest';
import trackingManager from 'common/services/TrackingManager';
import type { Video, VideoResource } from 'common/types/video';
import { buildResumeAfterBreakEventObject } from 'common/utils/analytics';
import { getLanguageCodeFromAudioTrack } from 'common/utils/audioTracks';
import { sendGA4Event } from 'common/utils/ga';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getVideoResolutionType } from 'common/utils/qualityLevels';
import { trackEvent } from 'common/utils/track';
import { getUrlParam } from 'common/utils/urlManipulation';
import { getVideoResource } from 'web/features/playback/components/VideoDetail/utils/getVideoResource';
import type { GetVideoResourceParams } from 'web/features/playback/components/VideoDetail/utils/getVideoResource';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';
import { qualityLevelSelector } from 'web/features/playback/selectors/player';

const NO_PLAYER_INSTANCE = 'No Player instance';

export interface UseAttachAnalyticsEventsParams {
  startPosition: number;
  video: Video;
  videoResourceManagerOldPosition: VideoResourceManager | undefined;
  isContentReady: boolean;
  videoResourceOldPosition: VideoResource | undefined
}

export const useAttachAnalyticsEvents = ({
  startPosition,
  video,
  videoResourceManagerOldPosition,
  isContentReady,
  videoResourceOldPosition,
}: UseAttachAnalyticsEventsParams) => {
  const qualityLevel = useAppSelector(qualityLevelSelector);
  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const webRepositionVideoResource = useExperiment(WebRepositionVideoResource);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const playerRef = useRef<InstanceType<typeof Player> | null>(null);

  // Allows us to access latest value of qualityLevel
  // without regenerting callbacks
  const qualityLevelRef = useLatest(qualityLevel);

  // Packing all of these props into a single object prevents us
  // from having to list all of them as dependencies later
  const getVideoResourceParams = useMemo<GetVideoResourceParams>(() => {
    return {
      webRepositionVideoResource,
      video,
      drmKeySystem,
      isDRMSupported,
      videoResourceManager: videoResourceManagerOldPosition,
      isContentReady,
      videoResource: videoResourceOldPosition,
    };
  }, [webRepositionVideoResource, video, drmKeySystem, isDRMSupported, videoResourceManagerOldPosition, isContentReady, videoResourceOldPosition]);

  /**
   * Helps ensure we only track the first frame event once
   */
  const hasPlaybackStartedRef = useRef(false);

  /**
   * Intended to be subscribed to the firstFrame event
   */
  const onFirstFrame = useCallback(() => {
    // type guard
    /* istanbul ignore next */
    if (!playerRef.current) return;
    if (hasPlaybackStartedRef.current) return;
    hasPlaybackStartedRef.current = true;
    const { id: contentId, has_subtitle: hasSubtitles = false } = video;

    const videoResource = getVideoResource(getVideoResourceParams);
    if (videoResource) {
      const audioTrack = playerRef.current?.getCurrentAudioTrack();
      const audioLanguage = audioTrack ? getLanguageCodeFromAudioTrack(audioTrack) : 'UNKNOWN';
      const videoResolution = qualityLevelRef.current && getVideoResolutionType(qualityLevelRef.current);
      /**
         * If the user is on auto, we should track the current bitrate level if available
         */
      let bitrate: number | undefined = qualityLevelRef.current?.bitrate;
      if (videoResolution === VideoResolutionType.VIDEO_RESOLUTION_AUTO || videoResolution === VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN) {
        bitrate = playerRef.current?.getQualityLevel()?.bitrate;
      }

      trackingManager.trackStartVideoEvent({
        contentId,
        resumePos: startPosition,
        isAutoplay: !!getUrlParam().autoplay,
        videoResource,
        hasSubtitles,
        audioLanguage,
        videoResolution,
        bitrate,
      });
      // follow the name convention used by GA4 Enhanced Measurement
      // https://support.google.com/analytics/answer/9216061
      sendGA4Event('video_start', {
        video_url: getCurrentPathname(),
      });
    }

  }, [playerRef, getVideoResourceParams, video, qualityLevelRef, startPosition]);

  // Allows us to keep a ref to the callback we last subscribed so that
  // we can unsubscribe from it later even if the callback is regenerated
  const firstFrameUnsubscribeCallback = useRef<() => void>();

  /**
   * Intended to be subscribed to the adPodComplete, adPodFetchError,
   * and adPodEmpty events
   */
  const trackResumeAfterBreak = useCallback(() => {
    // type guard
    /* istanbul ignore next */
    if (!playerRef.current) throw new Error(NO_PLAYER_INSTANCE);
    const { id: contentId } = video;
    const resumeAfterBreakEventPayload = buildResumeAfterBreakEventObject(contentId, playerRef.current.getPosition());
    trackEvent(eventTypes.RESUME_AFTER_BREAK, resumeAfterBreakEventPayload);
  }, [playerRef, video]);

  // Allows us to keep a ref to the callback we last subscribed so that
  // we can unsubscribe from it later even if the callback is regenerated
  const trackResumeAfterBreakUnsubscribeCallback = useRef<() => void>();

  /**
   * Intended to be subscribed to the startupPerformance event
   */
  const trackStartupPerformance = useCallback(({
    isAd,
    metrics,
    preloaded = false,
    isAfterAd = false,
    isFromPreroll = false,
    ad,
    adSequence,
    adsCount,
    adPosition,
    isPreroll,
  }: StartupPerformanceEventData) => {
    const { id: contentId } = video;
    const videoResource = getVideoResource(getVideoResourceParams);
    if (isAd) {
      trackAdStartupPerformance({
        ad,
        adSequence,
        adsCount,
        adPosition,
        isPreroll,
        metrics,
      });
    } else {
      const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = playerRef.current?.getQualityLevel() ?? {};
      trackContentStartupPerformance({
        contentId,
        metrics,
        videoResource,
        preloaded,
        startPosition,
        isAfterAd,
        isFromPreroll,
        currentVideoResolution: getFormatResolution(currentResolutionWidth, currentResolutionHeight),
      });
      trackPlayerPerformanceMetrics(metrics);
    }
  }, [playerRef, video, getVideoResourceParams, startPosition]);

  // Allows us to keep a ref to the callback we last subscribed so that
  // we can unsubscribe from it later even if the callback is regenerated
  const trackStartupPerformanceUnsubscribeCallback = useRef<() => void>();

  return {
    attachAnalyticsEvents: (player: Player) => {
      playerRef.current = player;
      // On first frame
      player.on(PLAYER_EVENTS.firstFrame, onFirstFrame);
      firstFrameUnsubscribeCallback.current = () => {
        player.off(PLAYER_EVENTS.firstFrame, onFirstFrame);
      };

      // Resume after break
      player.on(PLAYER_EVENTS.adPodComplete, trackResumeAfterBreak);
      player.on(PLAYER_EVENTS.adPodFetchError, trackResumeAfterBreak);
      player.on(PLAYER_EVENTS.adPodEmpty, trackResumeAfterBreak);
      trackResumeAfterBreakUnsubscribeCallback.current = () => {
        player.off(PLAYER_EVENTS.adPodComplete, trackResumeAfterBreak);
        player.off(PLAYER_EVENTS.adPodFetchError, trackResumeAfterBreak);
        player.off(PLAYER_EVENTS.adPodEmpty, trackResumeAfterBreak);
      };

      // Track startup performance
      player.on(PLAYER_EVENTS.startupPerformance, trackStartupPerformance);
      trackStartupPerformanceUnsubscribeCallback.current = () => {
        player.off(PLAYER_EVENTS.startupPerformance, trackStartupPerformance);
      };
    },
    detachAnalyticsEvents: () => {
      firstFrameUnsubscribeCallback.current?.();
      trackResumeAfterBreakUnsubscribeCallback.current?.();
      trackStartupPerformanceUnsubscribeCallback.current?.();
    },
  };
};
