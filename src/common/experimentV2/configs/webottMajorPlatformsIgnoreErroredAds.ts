import type { ExperimentDescriptor } from './types';

const webottMajorPlatformsIgnoreErroredAds: ExperimentDescriptor<{
  enable_ignore_errored_ads_v0: false | true;
}> = {
  name: 'webott_major_platforms_ignore_errored_ads_v0',
  defaultParams: {
    enable_ignore_errored_ads_v0: false,
  },
};

export default webottMajorPlatformsIgnoreErroredAds;
