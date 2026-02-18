import type { ExperimentDescriptor } from './types';

export const ottMajorPlatformsPreRequestRainmakerUrlWhenNearlyFinishPreview: ExperimentDescriptor<{
  enable_pre_request_rainmaker_v2: boolean;
}> = {
  name: 'webott_major_platforms_pre_request_rainmaker_url_when_nearly_finish_preview_v2',
  defaultParams: {
    enable_pre_request_rainmaker_v2: false,
  },
};
