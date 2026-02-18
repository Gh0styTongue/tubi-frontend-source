import type { StartupPerformanceEventData } from '@adrise/player';
import { PLAYER_EVENTS,
} from '@adrise/player';
import { getFormatResolution } from '@adrise/utils/lib/getFormatResolution';
import { VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useRef } from 'react';

import { trackAdStartupPerformance } from 'client/features/playback/track/client-log/trackAdStartupPerformance';
import { trackContentStartupPerformance } from 'client/features/playback/track/client-log/trackContentStartupPerformance';
import { trackPlayerPerformanceMetrics } from 'client/features/playback/track/datadog';
import * as eventTypes from 'common/constants/event-types';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useDecoupledPlayerEvent } from 'common/features/playback/hooks/usePlayerEvent';
import useAppSelector from 'common/hooks/useAppSelector';
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
import { qualityLevelSelector } from 'web/features/playback/selectors/player';

const NO_PLAYER_INSTANCE = 'No Player instance';

export interface UseAttachAnalyticsEventsParams {
  startPosition: number;
  video: Video;
  videoResource: VideoResource | undefined
}

export const useAttachAnalyticsEvents = ({
  startPosition,
  video,
  videoResource,
}: UseAttachAnalyticsEventsParams) => {
  const qualityLevel = useAppSelector(qualityLevelSelector);
  const { getPlayerInstance } = useGetPlayerInstance();

  // Allows us to access latest value of qualityLevel
  // without regenerting callbacks
  const qualityLevelRef = useLatest(qualityLevel);
  const videoRef = useLatest(video);
  const videoResourceRef = useLatest(videoResource);
  const startPositionRef = useLatest(startPosition);

  /**
   * Helps ensure we only track the first frame event once
   */
  const hasPlaybackStartedRef = useRef(false);

  /**
   * Intended to be subscribed to the firstFrame event
   */
  const onFirstFrame = useCallback(() => {
    const player = getPlayerInstance();
    // type guard
    /* istanbul ignore next */
    if (!player) return;
    if (hasPlaybackStartedRef.current) return;
    hasPlaybackStartedRef.current = true;
    const { id: contentId, has_subtitle: hasSubtitles = false } = videoRef.current;

    if (videoResourceRef.current) {
      const audioTrack = player.getCurrentAudioTrack();
      const audioLanguage = audioTrack ? getLanguageCodeFromAudioTrack(audioTrack) : 'UNKNOWN';
      const videoResolution = qualityLevelRef.current && getVideoResolutionType(qualityLevelRef.current);
      /**
         * If the user is on auto, we should track the current bitrate level if available
         */
      let bitrate: number | undefined = qualityLevelRef.current?.bitrate;
      if (videoResolution === VideoResolutionType.VIDEO_RESOLUTION_AUTO || videoResolution === VideoResolutionType.VIDEO_RESOLUTION_UNKNOWN) {
        bitrate = player.getQualityLevel()?.bitrate;
      }

      trackingManager.trackStartVideoEvent({
        contentId,
        resumePos: startPositionRef.current,
        isAutoplay: !!getUrlParam().autoplay,
        videoResource: videoResourceRef.current,
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

  }, [videoRef, qualityLevelRef, videoResourceRef, startPositionRef, getPlayerInstance]);

  /**
   * Intended to be subscribed to the adPodComplete, adPodFetchError,
   * and adPodEmpty events
   */
  const trackResumeAfterBreak = useCallback(() => {
    const player = getPlayerInstance();
    // type guard
    /* istanbul ignore next */
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const { id: contentId } = videoRef.current;
    const resumeAfterBreakEventPayload = buildResumeAfterBreakEventObject(contentId, player.getPosition());
    trackEvent(eventTypes.RESUME_AFTER_BREAK, resumeAfterBreakEventPayload);
  }, [getPlayerInstance, videoRef]);

  /**
   * Intended to be subscribed to the startupPerformance event
   */
  const trackStartupPerformance = useCallback(({
    isAd,
    metrics,
    isAfterAd = false,
    isFromPreroll = false,
    ad,
    adSequence,
    adsCount,
    adPosition,
    isPreroll,
  }: StartupPerformanceEventData) => {
    const player = getPlayerInstance();
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const { id: contentId } = videoRef.current;
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
      const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = player.getQualityLevel() ?? {};
      trackContentStartupPerformance({
        contentId,
        metrics,
        videoResource: videoResourceRef.current,
        startPosition: startPositionRef.current,
        isAfterAd,
        isFromPreroll,
        currentVideoResolution: getFormatResolution(currentResolutionWidth, currentResolutionHeight),
      });
      trackPlayerPerformanceMetrics(metrics);
    }
  }, [getPlayerInstance, videoRef, videoResourceRef, startPositionRef]);

  useDecoupledPlayerEvent(PLAYER_EVENTS.firstFrame, onFirstFrame);
  useDecoupledPlayerEvent(PLAYER_EVENTS.adPodComplete, trackResumeAfterBreak);
  useDecoupledPlayerEvent(PLAYER_EVENTS.adPodFetchError, trackResumeAfterBreak);
  useDecoupledPlayerEvent(PLAYER_EVENTS.adPodEmpty, trackResumeAfterBreak);
  useDecoupledPlayerEvent(PLAYER_EVENTS.startupPerformance, trackStartupPerformance);
};
