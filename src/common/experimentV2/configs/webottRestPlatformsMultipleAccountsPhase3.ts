import type { ExperimentDescriptor } from './types';

export const webottRestPlatformsMultipleAccountsPhase3: ExperimentDescriptor<{
  enable_multiple_accounts: boolean;
}> = {
  name: 'webott_rest_platforms_multiple_accounts_phase_3',
  defaultParams: {
    enable_multiple_accounts: false,
  },
};
