import { useState } from 'react';

import {
  VODPlaybackSession,
} from 'client/features/playback/session/VODPlaybackSession';
import {
  trackEmptyVideoResources,
} from 'client/features/playback/track/client-log';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import useAppSelector from 'common/hooks/useAppSelector';
import type { Video, VideoResource } from 'common/types/video';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';

export interface UseVideoResourceManagerProps {
  video: Video;
  isContentReady: boolean;
}

export const useVideoResourceManagerOldPosition = ({ video, isContentReady }: UseVideoResourceManagerProps) => {

  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const [videoResourceOldPosition, setVideoResourceOldPosition] = useState<VideoResource | undefined>();

  let showDRMUnsupportedWarning = false;
  let videoResourceManagerOldPosition: VideoResourceManager | undefined;
  if (isContentReady) {
    const videoResources = video.video_resources || [];
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    videoResourceManagerOldPosition = getCachedVideoResourceManager({
      videoResources,
      drmKeySystem,
      isDRMSupported,
      rememberFallback: true,
    });
    // This usually means some bug if we get no video resources after the filter.
    if (videoResources && videoResources.length > 0 && videoResourceManagerOldPosition.getAllLevelsForCurrentCodec().length === 0) {
      showDRMUnsupportedWarning = !!videoResourceManagerOldPosition.isEmptyDueToDrmSupport;
      trackEmptyVideoResources({
        content_id: video.id,
        showDRMUnsupportedWarning,
        drmKeySystem,
        isDRMSupported,
        track_id: playbackInfo.trackId,
      });
    }
  }

  const nextVideoResource = videoResourceManagerOldPosition?.getCurrentResource();
  if (nextVideoResource !== videoResourceOldPosition) {
    setVideoResourceOldPosition(nextVideoResource);
  }

  return { videoResourceManagerOldPosition, showDRMUnsupportedWarning, videoResourceOldPosition, setVideoResourceOldPosition };
};
