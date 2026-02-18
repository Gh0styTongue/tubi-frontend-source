import type { ExperimentDescriptor } from './types';

export const webottFiretvMultipleAccountsPhase2V3: ExperimentDescriptor<{
  show_account_prompt: boolean;
}> = {
  name: 'webott_firetv_multiple_accounts_phase_2_v3',
  defaultParams: {
    show_account_prompt: false,
  },
};
