import { trimQueryString } from '@adrise/utils/lib/url';

import type { VideoResource } from 'common/types/video';

import type { VideoResourceFallbackParams } from './types';

function getMessageParamsFromVideoResource(videoResource?: VideoResource) {
  return {
    hdcp: videoResource?.license_server?.hdcp_version,
    type: videoResource?.type,
    url: trimQueryString(videoResource?.manifest?.url ?? ''),
    codec: videoResource?.codec,
    resolution: videoResource?.resolution,
  };
}

export function getFallbackMessageFromVideoResources({
  failedVideoResource,
  fallbackVideoResource,
}: Omit<VideoResourceFallbackParams, 'contentId'>) {
  const failedResourceParams = getMessageParamsFromVideoResource(failedVideoResource);
  const fallbackResourceParams = getMessageParamsFromVideoResource(fallbackVideoResource);
  return {
    failed_hdcp_version: failedResourceParams.hdcp,
    failed_video_resource_type: failedResourceParams.type,
    failed_url: failedResourceParams.url,
    failed_video_codec_type: failedResourceParams.codec,
    failed_max_video_resolution: failedResourceParams.resolution,
    fallback_hdcp_version: fallbackResourceParams.hdcp,
    fallback_video_resource_type: fallbackResourceParams.type,
    fallback_url: fallbackResourceParams.url,
    fallback_video_codec_type: fallbackResourceParams.codec,
    fallback_max_video_resolution: fallbackResourceParams.resolution,
  };
}
