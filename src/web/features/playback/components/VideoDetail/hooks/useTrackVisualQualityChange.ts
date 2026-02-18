import type { QualityLevel } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback } from 'react';

import { trackVisualQualityChange } from 'client/features/playback/track/client-log/trackVisualQualityChange';
import { VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useDecoupledPlayerEvent } from 'common/features/playback/hooks/usePlayerEvent';
import type VideoResourceManager from 'common/features/playback/services/VideoResourceManager';
import useLatest from 'common/hooks/useLatest';
import type { Video, VideoResource } from 'common/types/video';

export interface UseTrackVisualQualityChangeProps {
  video: Video;
  videoResourceManager: VideoResourceManager | undefined;
  isContentReady: boolean;
  videoResource: VideoResource | undefined;
}

export const useTrackVisualQualityChange = ({
  video,
  videoResource,
}: UseTrackVisualQualityChangeProps) => {
  const videoRef = useLatest(video);
  const videoResourceRef = useLatest(videoResource);
  const { getPlayerInstance } = useGetPlayerInstance();

  const onVisualQualityChange = useCallback(({ qualityIndex, level }: {qualityIndex: number, level: QualityLevel }) => {
    const { id } = videoRef.current;
    const player = getPlayerInstance();

    trackVisualQualityChange({
      player,
      contentId: id,
      qualityIndex,
      videoResource: videoResourceRef.current,
      position: player?.getPosition() || -1,
      playerType: VIDEO_CONTENT_TYPE,
      level,
    });
  }, [videoRef, videoResourceRef, getPlayerInstance]);

  useDecoupledPlayerEvent(PLAYER_EVENTS.visualQualityChange, onVisualQualityChange);
};
