import type { VideoResourceType } from 'common/types/video';

/**
 * Return the DRM type to use for monitoring a given video resource
 * @param videoResource - The video resource that will be used for playback
 */
export function getVideoMonitoringDRM(type: VideoResourceType | undefined): string | undefined {
  switch (type) {
    case 'hlsv6_fairplay':
      return 'fairplay';
    case 'dash_widevine':
    case 'hlsv6_widevine':
      return 'widevine';
    case 'hlsv6_playready':
    case 'dash_playready':
      return 'playready';
    default:
      break;
  }
}
