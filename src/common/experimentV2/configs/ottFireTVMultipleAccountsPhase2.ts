import type { ExperimentDescriptor } from './types';

export const ottFireTVMultipleAccountsPhase2: ExperimentDescriptor<{
  enable_multiple_accounts: boolean;
  enable_kid_accounts: boolean;
}> = {
  name: 'webott_firetv_multiple_accounts_phase_2',
  defaultParams: {
    enable_multiple_accounts: false,
    enable_kid_accounts: false,
  },
};
