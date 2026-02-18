import type { OTT_STAGING_REDIRECT_TREATMENT } from 'common/experiments/config/ottStagingRedirect';

import type { ExperimentDescriptor } from './types';

export const ottRedirect: ExperimentDescriptor<{
  environment: OTT_STAGING_REDIRECT_TREATMENT;
}> = {
  name: 'ott_redirect',
  defaultParams: {
    environment: 0,
  },
};
