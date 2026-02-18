import type {
  ErrorEventData,
  Player } from '@adrise/player';
import {
  PLAYER_ERROR_DETAILS,
} from '@adrise/player';
import { useCallback } from 'react';

import { isFatalError } from 'client/features/playback/error/isFatalError';
import { isDrmError, isHlsJsCodecError } from 'client/features/playback/error/predictor';
import { trackFallback } from 'client/features/playback/track/client-log/trackFallback';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import useLatest from 'common/hooks/useLatest';
import type { Video, VideoResource } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';

interface GetFallbackPositionParams {
  startPosition: number;
  player: Player | undefined
}

// this utility exported for testing only
export const getFallbackPosition = ({ startPosition, player }: GetFallbackPositionParams) => {
  // when encountering an error, hls.js attempt playback from the beginning
  // causing the most recent position to be 0 and causing onFirstFrame/Playing
  // events to be triggered (always at around 0.2s as per hls.js time events.)
  // When an error occurs, we should fallback to the history (startPosition)
  // or use the last valid position before the error occurred. If we don't
  // have history (coming from continue watching) and we've watched less than
  // one second before an error occurred, startPosition would be 0 which is
  // the correct valid value.
  const lastPosition = player ? player.getPosition() : 0;
  return lastPosition > 1 ? lastPosition : startPosition;
};

export interface UseTryFallbackVideoResourceProps {
  video: Video;
  videoResourceManager: VideoResourceManager | undefined;
  setResumePosition: (position: number) => void;
  startPosition: number;
  setVideoResource: (videoResource: VideoResource | undefined) => void;
}

export const useTryFallbackVideoResource = ({
  video,
  videoResourceManager,
  setResumePosition,
  startPosition,
  setVideoResource,
}: UseTryFallbackVideoResourceProps) => {
  const { getPlayerInstance } = useGetPlayerInstance();

  const startPositionRef = useLatest(startPosition);
  const videoResourceManagerRef = useLatest(videoResourceManager);
  const videoRef = useLatest(video);
  const setResumePositionRef = useLatest(setResumePosition);
  const setVideoResourceRef = useLatest(setVideoResource);

  const tryFallbackVideoResource = useCallback((error: ErrorEventData) => {
    const player = getPlayerInstance();
    const resumePosition = getFallbackPosition({ startPosition: startPositionRef.current, player });
    const failedVideoResource = videoResourceManagerRef.current?.getCurrentResource();
    const isDRMError = isDrmError(error);

    let fallbackVideoResource;
    if (isHlsJsCodecError(error) || (failedVideoResource?.codec === VIDEO_RESOURCE_CODEC.HEVC && isFatalError(error))) {
      fallbackVideoResource = videoResourceManagerRef.current?.fallback({ changeCodec: true });
      // when we find a fallback, track this
      if (fallbackVideoResource) {
        trackFallback('CODEC', {
          contentId: videoRef.current.id,
          failedVideoResource,
          fallbackVideoResource,
        });
      }
    } else if (isDRMError) {
      const notSkipDrm = [
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INTERNAL_ERROR,
        PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_INVALID_HDCP_VERSION,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INVALID_STATUS,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED,
        PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED,
      ];
      if ((notSkipDrm).includes(error.details as string)) {
        fallbackVideoResource = videoResourceManagerRef.current?.fallback();
        if (error.details !== PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED) {
          setResumePositionRef.current(resumePosition);
        }
      } else {
        fallbackVideoResource = videoResourceManagerRef.current?.fallback({ skipDRM: true });
      }
      if (fallbackVideoResource) {
        trackFallback('DRM', {
          contentId: videoRef.current.id,
          failedVideoResource,
          fallbackVideoResource,
        });
      }
    }

    if (fallbackVideoResource) {
      setVideoResourceRef.current(fallbackVideoResource);
    }

    return fallbackVideoResource;

    // To eliminate the need to re-generate this callback, all
    // dependencies are passed as refs
  }, [
    getPlayerInstance,
    startPositionRef,
    videoResourceManagerRef,
    videoRef,
    setResumePositionRef,
    setVideoResourceRef,
  ]);

  return {
    tryFallbackVideoResource,
  };
};
