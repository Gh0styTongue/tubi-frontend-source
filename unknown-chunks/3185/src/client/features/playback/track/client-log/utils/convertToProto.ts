import type { GET_FORMAT_RESOLUTION_TYPE } from 'common/features/playback/utils/getFormatResolution';
import type { VideoResourceType, VIDEO_RESOURCE_CODEC, VIDEO_RESOURCE_RESOLUTION, HDCPVersion } from 'common/types/video';

export const VideoResourceTypeToProto: { [type in VideoResourceType]: number } = {
  unknown: 0,
  hlsv3: 1,
  hlsv6: 2,
  dash_widevine: 3,
  dash_playready: 4,
  dash_fairplay: 5,
  hlsv6_widevine: 6,
  dash: 7,
  hlsv6_playready: 8,
  hlsv6_fairplay: 9,
  hlsv6_playready_nonclearlead: 10,
  dash_playready_psshv0: 11,
  hlsv6_widevine_nonclearlead: 12,
  hlsv6_widevine_psshv0: 13,
  hlsv6_playready_psshv0: 14,
  dash_widevine_nonclearlead: 15,
  dash_playready_nonclearlead: 16,
  dash_widevine_psshv0: 17,
} as const;

export const VideoResourceCodecToProto: { [codec in VIDEO_RESOURCE_CODEC]: number } = {
  UNKNOWN: 0,
  H264: 1,
  H265: 2,
} as const;

export const HDCPVersionToProto: { [hdcp in HDCPVersion]: number } = {
  hdcp_unknown: 0,
  hdcp_v1: 1,
  hdcp_v2: 2,
  hdcp_disabled: 3,
} as const;

export const VideoResolutionToProto: { [resolution in GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION]: number } = {
  '144P': 0, // not supported in protos
  '240P': 1,
  '360P': 2,
  '480P': 3,
  '576P': 0, // not supported in protos
  '720P': 5,
  '1080P': 6,
  '1440P': 0, // not supported in protos
  '2160P': 7,
  '4320P': 0, // not supported in protos
  'UNKNOWN': 0,
} as const;

// We cannot directly send two dimensional array to protos, like [[0, 10], [20, 30]], need to convert it to [{ key: [0, 10] }, { key: [20, 30] }]
export function twoDimensionalArrayToProto(
  list: number[][] | undefined,
  key: string,
): { [x: string]: number[] }[] | undefined {
  return list?.map((stepList: number[]) => {
    return {
      [key]: stepList,
    };
  });
}
