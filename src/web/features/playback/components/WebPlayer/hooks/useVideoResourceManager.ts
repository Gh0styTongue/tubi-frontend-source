import { useEffect, useMemo, useState } from 'react';

import {
  VODPlaybackSession,
} from 'client/features/playback/session/VODPlaybackSession';
import {
  trackEmptyVideoResources,
} from 'client/features/playback/track/client-log';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import useAppSelector from 'common/hooks/useAppSelector';
import type { AudioTrackMetadata, Video, VideoResource } from 'common/types/video';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';

export interface UseVideoResourceManagerProps {
  video: Video;
  setShouldShowDRMUnsupportedWarning: (shouldShow: boolean) => void;
  setAudioTracks: (tracks: AudioTrackMetadata[]) => void;
}

export const useVideoResourceManager = ({ video, setShouldShowDRMUnsupportedWarning, setAudioTracks }: UseVideoResourceManagerProps) => {

  const drmKeySystem = useAppSelector(drmKeySystemSelector);
  const isDRMSupported = useAppSelector(isDRMSupportedSelector);
  const [videoResource, setVideoResource] = useState<VideoResource | undefined>();

  const videoResources = useMemo(() => video.video_resources || [], [video.video_resources]);
  const videoResourceManager = getCachedVideoResourceManager({
    videoResources,
    drmKeySystem,
    isDRMSupported,
    rememberFallback: true,
  });

  useEffect(() => {
    const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
    // This usually means some bug if we get no video resources after the filter.
    if (videoResources && videoResources.length > 0 && videoResourceManager.getAllLevelsForCurrentCodec().length === 0) {
      const showDRMUnsupportedWarning = !!videoResourceManager.isEmptyDueToDrmSupport;
      setShouldShowDRMUnsupportedWarning(showDRMUnsupportedWarning);
      trackEmptyVideoResources({
        content_id: video.id,
        showDRMUnsupportedWarning,
        drmKeySystem,
        isDRMSupported,
        track_id: playbackInfo.trackId,
      });
    }

    const nextVideoResource = videoResourceManager?.getCurrentResource();
    if (nextVideoResource !== videoResource) {
      setVideoResource(nextVideoResource);
    }
  }, [video.id, videoResourceManager, videoResource, drmKeySystem, isDRMSupported, videoResources, setShouldShowDRMUnsupportedWarning]);

  useEffect(() => {
    if (videoResource) {
      setAudioTracks(videoResource.audio_tracks || []);
    }
  }, [videoResource, setAudioTracks]);

  return { videoResourceManager, videoResource, setVideoResource };
};
