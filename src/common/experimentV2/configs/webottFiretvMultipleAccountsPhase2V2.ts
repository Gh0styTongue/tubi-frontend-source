import type { ExperimentDescriptor } from './types';

export const webottFiretvMultipleAccountsPhase2V2: ExperimentDescriptor<{
  enable_multiple_accounts: boolean;
  enable_who_s_watching: boolean;
}> = {
  name: 'webott_firetv_multiple_accounts_phase_2_v2',
  defaultParams: {
    enable_multiple_accounts: false,
    enable_who_s_watching: false,
  },
};
