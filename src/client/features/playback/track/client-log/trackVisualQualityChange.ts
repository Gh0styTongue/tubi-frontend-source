import type { Player, QualityLevel } from '@adrise/player';

import { VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import type { VideoResource } from 'common/types/video';
import type { LinearPageTypes } from 'common/utils/linearPageType';
import { trackLogging } from 'common/utils/track';

import { getClientLogInfoForVideoDetail } from './utils/getClientLogInfoForVideoDetail';

interface VisualQualityChangeParams {
  player?: Player | null;
  qualityIndex: number;
  contentId: string;
  videoResource?: VideoResource;
  position: number;
  pageType?: LinearPageTypes;
  playerType?: string;
  level: QualityLevel;
  lastQualityIndex?: number;
  qualityChangeDirection?: string;
}

export function trackVisualQualityChange({
  contentId: content_id,
  player,
  position,
  pageType,
  qualityIndex,
  videoResource,
  playerType = VIDEO_CONTENT_TYPE,
  level,
  lastQualityIndex,
  qualityChangeDirection,
}: VisualQualityChangeParams,
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.VISUAL_QUALITY_CHANGE,
    message: {
      qualityIndex,
      content_id,
      position,
      pageType,
      player: playerType,
      lastQualityIndex,
      qualityChangeDirection,
      ...level,
      ...getClientLogInfoForVideoDetail({
        videoResource,
        player,
      }),
    },
  });
}
