import type { ExperimentDescriptor } from './types';

export const webottWebRegistrationValueDetailsPage: ExperimentDescriptor<{
  variation: 0 | 1 | 2;
}> = {
  name: 'webott_web_registration_value_details_page',
  defaultParams: {
    variation: 0,
  },
};
