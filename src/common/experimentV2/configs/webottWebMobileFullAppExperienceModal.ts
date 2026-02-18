import type { ExperimentDescriptor } from './types';

export const webottWebMobileFullAppExperienceModal: ExperimentDescriptor<{
  variation: 0 | 1 | 2;
}> = {
  name: 'webott_web_mobile_full_app_experience_modal',
  defaultParams: {
    variation: 0,
  },
};
