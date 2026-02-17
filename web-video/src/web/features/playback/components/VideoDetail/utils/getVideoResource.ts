import type { DrmKeySystem } from '@adrise/player';

import type WebRepositionVideoResource from 'common/experiments/config/webRepositionVideoResource';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { Video, VideoResource } from 'common/types/video';

export interface GetVideoResourceParams {
  webRepositionVideoResource: ReturnType<typeof WebRepositionVideoResource>;
  video: Video;
  drmKeySystem?: DrmKeySystem;
  isDRMSupported: boolean;
  videoResourceManager?: VideoResourceManager;
  isContentReady: boolean;
  videoResource?: VideoResource;
}

interface GetVideoResourceManagerProps {
  video: Video;
  drmKeySystem?: DrmKeySystem;
  isDRMSupported: boolean;
  videoResourceManager?: VideoResourceManager;
  webRepositionVideoResource: ReturnType<typeof WebRepositionVideoResource>;
  isContentReady: boolean;
}

export const getVideoResource = (params: GetVideoResourceParams) => {
  const {
    webRepositionVideoResource,
    video,
    drmKeySystem,
    isDRMSupported,
    videoResourceManager,
    isContentReady,
    videoResource,
  } = params;

  if (FeatureSwitchManager.isEnabled(['Player', 'EnableReposition']) || webRepositionVideoResource.getValue()) {
    return getVideoResourceManager({
      video,
      drmKeySystem,
      isDRMSupported,
      videoResourceManager,
      webRepositionVideoResource,
      isContentReady,
    })?.getCurrentResource();
  }
  return videoResource;
};

export const getVideoResourceManager = (
  props: GetVideoResourceManagerProps
) => {
  const {
    video,
    drmKeySystem,
    isDRMSupported,
    videoResourceManager,
    webRepositionVideoResource,
    isContentReady,
  } = props;

  if (FeatureSwitchManager.isEnabled(['Player', 'EnableReposition']) || webRepositionVideoResource.getValue()) {
    return isContentReady ? getCachedVideoResourceManager({
      videoResources: video.video_resources ?? [],
      drmKeySystem,
      isDRMSupported,
      rememberFallback: true,
    }) : undefined;
  }
  return videoResourceManager;
};
