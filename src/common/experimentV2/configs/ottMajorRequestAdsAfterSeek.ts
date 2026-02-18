import type { ExperimentDescriptor } from './types';

export const ottMajorRequestAdsAfterSeek: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_major_request_ads_after_seek_v0',
  defaultParams: {
    enable: false,
  },
};
