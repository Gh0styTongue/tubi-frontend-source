import type { ExperimentDescriptor } from './types';

const webottMajorPlatformsContentAdsSameCodec: ExperimentDescriptor<{
  enable_content_ads_same_codec_v1: 'h264' | 'h265' | 'same_with_content';
}> = {
  name: 'webott_major_platforms_content_ads_same_codec_v1',
  defaultParams: {
    enable_content_ads_same_codec_v1: 'h264',
  },
};

export default webottMajorPlatformsContentAdsSameCodec;
