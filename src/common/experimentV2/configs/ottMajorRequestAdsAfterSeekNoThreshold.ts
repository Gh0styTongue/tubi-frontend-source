import type { ExperimentDescriptor } from './types';

export const ottMajorRequestAdsAfterSeekNoThreshold: ExperimentDescriptor<{
  rafs_no_threshold_enable: boolean;
}> = {
  name: 'webott_major_request_ads_after_seek_no_threshold_v0',
  defaultParams: {
    rafs_no_threshold_enable: false,
  },
};
