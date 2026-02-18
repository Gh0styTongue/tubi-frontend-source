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

export const useVideoResourceManager = ({ video, isContentReady }: UseVideoResourceManagerProps) => {

  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const [videoResource, setVideoResource] = useState<VideoResource | undefined>();

  let showDRMUnsupportedWarning = false;
  let videoResourceManager: VideoResourceManager | undefined;
  if (isContentReady) {
    const videoResources = video.video_resources || [];
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    videoResourceManager = getCachedVideoResourceManager({
      videoResources,
      drmKeySystem,
      isDRMSupported,
      rememberFallback: true,
    });
    // This usually means some bug if we get no video resources after the filter.
    if (videoResources && videoResources.length > 0 && videoResourceManager.getAllLevelsForCurrentCodec().length === 0) {
      showDRMUnsupportedWarning = !!videoResourceManager.isEmptyDueToDrmSupport;
      trackEmptyVideoResources({
        content_id: video.id,
        showDRMUnsupportedWarning,
        drmKeySystem,
        isDRMSupported,
        track_id: playbackInfo.trackId,
      });
    }
  }

  const nextVideoResource = videoResourceManager?.getCurrentResource();
  if (nextVideoResource !== videoResource) {
    setVideoResource(nextVideoResource);
  }

  return { videoResourceManager, showDRMUnsupportedWarning, videoResource, setVideoResource };
};
