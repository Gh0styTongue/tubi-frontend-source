import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import useLatest from 'common/hooks/useLatest';
import type { VideoResource } from 'common/types/video';

interface UseGetVideoResourceProps {
  enableReposition: boolean | undefined;
  videoResource: VideoResource | undefined
  videoResourceManagerV2Ref: MutableRefObject<VideoResourceManager | undefined>;

}

export const useGetVideoResource = ({ videoResource, enableReposition, videoResourceManagerV2Ref }: UseGetVideoResourceProps) => {
  // this prop is not stable during playback session
  const videoResourceRef = useLatest(videoResource);

  return {
    getVideoResource: useCallback(() => {
      if (enableReposition) {
        return videoResourceManagerV2Ref.current?.getCurrentResource();
      }
      return videoResourceRef.current;
    }, [enableReposition, videoResourceManagerV2Ref, videoResourceRef]),
  };
};

