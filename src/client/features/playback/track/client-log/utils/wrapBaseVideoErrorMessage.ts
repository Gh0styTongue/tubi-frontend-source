import { type ErrorEventData, MEDIA_ERROR_CODES } from '@adrise/player';
import { trimQueryString } from '@adrise/utils/lib/url';

import type { TrackVideoErrorParam } from './types';

function getBaseVideoErrorMessage(err: TrackVideoErrorParam['err']) {
  const errorCode = (MEDIA_ERROR_CODES[err.code as number] || err.code || err.type) ?? 'unknown error';
  const errorMessage = (err.message || err.details) ?? 'unknown error';
  return {
    error_code: errorCode,
    // We don't want to see so many unknown errors in our data.
    // Let's collect some more information about the error.
    error_message: errorMessage === errorCode ? JSON.stringify(err) : errorMessage,
  };
}

export function wrapBaseVideoErrorMessage({ videoUrl, err, position, contentId, adVideoId, adRequestId, videoResourceType, hdcp, bitrate, isLive, player, pageReloadRetryCount }: Partial<TrackVideoErrorParam> & { err: TrackVideoErrorParam['err'] }) {
  const response: Partial<ErrorEventData['response']> = err.response;
  if (response && (typeof response.data !== 'string' || response.data.length > 100)) {
    delete response.data;
  }
  if (response?.url) {
    response.url = trimQueryString(response.url);
  }

  return {
    ...getBaseVideoErrorMessage(err),
    // Remove querystring to save space
    video_url: videoUrl ? trimQueryString(videoUrl) : undefined,
    fatal: !!err.fatal,
    position,
    content_id: contentId,
    ad_video_id: adVideoId,
    ad_request_id: adRequestId,
    reason: err.reason,
    sub_error: err.err?.message,
    playback_type: videoResourceType,
    hdcp,
    bitrate,
    fragUrl: err.fragUrl,
    response: err.response,
    is_live: isLive,
    player,
    levelLoadTimes: err.levelLoadTimes,
    fragmentRetryTimes: err.fragmentRetryTimes,
    pageReloadRetryCount,
  };
}
