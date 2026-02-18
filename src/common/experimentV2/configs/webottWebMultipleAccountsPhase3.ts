import type { ExperimentDescriptor } from './types';

export const webottWebMultipleAccountsPhase3: ExperimentDescriptor<{
  enable_multiple_accounts: boolean;
}> = {
  name: 'webott_web_multiple_accounts_phase_3',
  defaultParams: {
    enable_multiple_accounts: false,
  },
};
