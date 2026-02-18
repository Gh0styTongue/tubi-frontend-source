import type { Player } from '@adrise/player';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { VideoResource } from 'common/types/video';

export function getClientLogInfoForVideoDetail({
  videoResource,
  player,
  customizedName,
}: {
    videoResource?: VideoResource,
    player?: InstanceType<typeof Player> | InstanceType<typeof LivePlayerWrapper> | null,
    customizedName?:{type?: string, codec?: string, resolution?: string},
}) {
  if (!videoResource) return {};
  const keyOfType = customizedName?.type ?? 'playback_type';
  const keyOfCodec = customizedName?.codec ?? 'playback_codec';
  const keyOfResolution = customizedName?.resolution ?? 'playback_resolution';
  return {
    [keyOfType]: videoResource.type,
    [keyOfCodec]: videoResource.codec,
    [keyOfResolution]: videoResource.resolution,
    playback_codec_detail: player?.getCodecs?.(),
    elReadyState: player?.getCurrentVideoElement()?.readyState,
    elPosition: player?.getCurrentVideoElement()?.currentTime,
    elDuration: player?.getCurrentVideoElement()?.duration,
    isVideoBuffered: player?.getIsCurrentTimeVideoBuffered?.(),
    isAudioBuffered: player?.getIsCurrentTimeAudioBuffered?.(),
  };
}
