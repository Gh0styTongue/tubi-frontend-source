import type { ExperimentDescriptor } from './types';

export const webRequestAdsAfterSeek: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_web_request_ads_after_seek_v0',
  defaultParams: {
    enable: false,
  },
};
