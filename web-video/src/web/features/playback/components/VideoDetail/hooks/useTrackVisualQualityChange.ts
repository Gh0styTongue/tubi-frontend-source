import type { Player, QualityLevel } from '@adrise/player';
import { useCallback } from 'react';

import { trackVisualQualityChange } from 'client/features/playback/track/client-log/trackVisualQualityChange';
import { VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import WebRepositionVideoResource from 'common/experiments/config/webRepositionVideoResource';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import useLatest from 'common/hooks/useLatest';
import type { Video, VideoResource } from 'common/types/video';
import { getVideoResource } from 'web/features/playback/components/VideoDetail/utils/getVideoResource';
import { drmKeySystemSelector, isDRMSupportedSelector } from 'web/features/playback/selectors/drm';

export interface UseTrackVisualQualityChangeProps {
  video: Video;
  playerRef: React.MutableRefObject<Player | null>;
  videoResourceManagerOldPosition: VideoResourceManager | undefined;
  isContentReady: boolean;
  videoResourceOldPosition: VideoResource | undefined;
}

export const useTrackVisualQualityChange = ({
  video,
  playerRef,
  videoResourceManagerOldPosition,
  isContentReady,
  videoResourceOldPosition,
}: UseTrackVisualQualityChangeProps) => {
  const webRepositionVideoResource = useExperiment(WebRepositionVideoResource);
  const drmKeySystemRef = useLatest(useAppSelector(drmKeySystemSelector));
  const isDRMSupportedRef = useLatest(useAppSelector(isDRMSupportedSelector));
  const isContentReadyRef = useLatest(isContentReady);
  const videoRef = useLatest(video);
  const videoResourceFromPropsRef = useLatest(videoResourceOldPosition);
  const videoResourceManagerRef = useLatest(videoResourceManagerOldPosition);

  const onVisualQualityChange = useCallback(({ qualityIndex, level }: {qualityIndex: number, level: QualityLevel }) => {

    const { id } = videoRef.current;

    const videoResource = getVideoResource({
      webRepositionVideoResource,
      video: videoRef.current,
      drmKeySystem: drmKeySystemRef.current,
      isDRMSupported: isDRMSupportedRef.current,
      videoResourceManager: videoResourceManagerRef.current,
      isContentReady: isContentReadyRef.current,
      videoResource: videoResourceFromPropsRef.current,
    });

    trackVisualQualityChange({
      player: playerRef.current,
      contentId: id,
      qualityIndex,
      videoResource,
      position: playerRef.current?.getPosition() || -1,
      playerType: VIDEO_CONTENT_TYPE,
      level,
    });

  }, [
    drmKeySystemRef,
    isContentReadyRef,
    isDRMSupportedRef,
    playerRef,
    videoRef,
    videoResourceFromPropsRef,
    videoResourceManagerRef,
    webRepositionVideoResource,
  ]);

  return {
    onVisualQualityChange,
  };
};
