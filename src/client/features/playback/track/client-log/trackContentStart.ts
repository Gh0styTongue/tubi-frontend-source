import type { ContentStartData } from '@adrise/player/lib';
import { type GET_FORMAT_RESOLUTION_TYPE } from '@adrise/utils/lib/getFormatResolution';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { type VideoResource, type VIDEO_RESOURCE_RESOLUTION, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsContentStart } from '../analytics-ingestion-v3';
import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from './utils/convertToProto';
import { getPlayerDisplayType } from './utils/getPlayerDisplayType';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

export function trackContentStart({
  contentId,
  resumeFromAds,
  isFromPreroll,
  videoResource,
  position,
  currentVideoResolution,
}: {
  contentId: string;
  videoResource: VideoResource | undefined;
  currentVideoResolution: GET_FORMAT_RESOLUTION_TYPE;
} & ContentStartData) {
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: contentId,
    is_after_ad: resumeFromAds,
    is_from_preroll: isFromPreroll,
    is_from_autoplay: getVODPageSession().autoplay,
    start_position: Math.round(position * 1000), // millisecond
    video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(videoResource?.resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    current_video_resolution: VideoResolutionToProto[currentVideoResolution],
    message_map: convertObjectValueToString({
      player_type: getPlayerDisplayType(VODPlaybackSession.getVODPlaybackInfo().playerDisplayMode),
    }),
  };
  playerAnalyticsContentStart(playerAnalyticsData);
}
