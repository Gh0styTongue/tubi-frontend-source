import { getClosestBufferedRanges } from '@adrise/player/lib/utils/tools';
import Analytics from '@tubitv/analytics';

import { toFixed2 } from 'common/utils/format';

import { getClientLogInfoForVideoDetail } from './getClientLogInfoForVideoDetail';
import { getPlayerTypeFromPlayerName } from './getPlayerTypeFromPlayerName';
import type { VODClientLogBaseInfo, VODClientLogBaseParams } from './types';
import { VODPlaybackSession } from '../../../session/VODPlaybackSession';

function format(value: number = -1) {
  return toFixed2(value);
}

export function getVODClientLogBaseInfo({ contentId, videoResource, playerInstance, ...rest }: VODClientLogBaseParams): VODClientLogBaseInfo {
  const contentBwEstimate = playerInstance?.getBandwidthEstimate?.();
  const videoBufferedArray = playerInstance?.getBufferedVideoRange?.() ?? [];
  const audioBufferedArray = playerInstance?.getBufferedAudioRange?.() ?? [];
  const contentPos = format(playerInstance?.getPosition?.());
  const videoPos = format(playerInstance?.getPrecisePosition?.());
  const duration = format(playerInstance?.getDuration?.());
  const bufferLength = format(playerInstance?.getBufferedLength?.());
  return {
    ...rest,
    isAd: playerInstance?.isAd?.(),
    contentPos,
    position: videoPos,
    duration,
    hdcp: videoResource?.license_server?.hdcp_version,
    playerType: getPlayerTypeFromPlayerName(playerInstance?.playerName),
    seeking: playerInstance?.getCurrentVideoElement()?.seeking,
    buffering: VODPlaybackSession.getVODPlaybackInfo().isBuffering,
    bufferLength,
    closestVideoBufferedArray: getClosestBufferedRanges(videoBufferedArray, videoPos),
    closestAudioBufferedArray: getClosestBufferedRanges(audioBufferedArray, videoPos),
    bitrate: playerInstance?.getBitrate?.(),
    contentBwEstimate: contentBwEstimate !== undefined ? toFixed2(contentBwEstimate / 1024) : -1, // kbps
    content_id: contentId,
    release: Analytics.getAnalyticsConfig()?.app_version,
    sdk: playerInstance?.getSDKInfo?.(),
    ...getClientLogInfoForVideoDetail({
      videoResource,
      player: playerInstance,
      customizedName: {
        codec: 'videoResourceCodec',
        resolution: 'videoResourceResolution',
      },
    }),
  };
}
