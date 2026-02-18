import { RequestAdsAfterSeekVariant } from 'common/constants/experiments';

import type { ExperimentDescriptor } from './types';

export const ottMajorRequestAdsAfterSeekWithCountDown: ExperimentDescriptor<{
  mode: RequestAdsAfterSeekVariant;
}> = {
  name: 'webott_major_request_ads_after_seek_with_countdown_v1',
  defaultParams: {
    mode: RequestAdsAfterSeekVariant.Control,
  },
};
