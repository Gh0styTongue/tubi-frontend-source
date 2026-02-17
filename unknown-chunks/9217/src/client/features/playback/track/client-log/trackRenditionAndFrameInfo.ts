import type { RenditionFrameData } from 'client/features/playback/services/RenditionAndFrameInfoManager';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackRenditionAndFrameInfo(contentId: string, data: RenditionFrameData[]) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.RENDITION_AND_FRAME,
    message: {
      contentId,
      data,
    },
  });
}
