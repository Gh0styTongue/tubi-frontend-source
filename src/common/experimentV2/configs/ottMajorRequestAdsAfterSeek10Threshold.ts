import type { ExperimentDescriptor } from './types';

export const ottMajorRequestAdsAfterSeek10Threshold: ExperimentDescriptor<{
  rafs_10_threshold_enable: boolean;
}> = {
  name: 'webott_major_request_ads_after_seek_10_threshold_v0',
  defaultParams: {
    rafs_10_threshold_enable: false,
  },
};
