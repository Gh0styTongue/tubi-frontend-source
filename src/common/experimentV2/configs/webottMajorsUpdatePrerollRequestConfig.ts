import type { ExperimentDescriptor } from './types';

export const enum PrerollRequestConfigVariant {
  CONTROL = 0, // {timeout: 10, retry: 3}
  LONG_TIMEOUT_NO_RETRY = 1, // {timeout: 15, retry: 0}
  FAST_TIMEOUT_NO_RETRY = 2, // {timeout: 8, retry: 0}
  FAST_FAIL = 3, // {timeout: 5, retry: 0}
}

export const PREROLL_REQUEST_CONFIG_OPTIONS: Record<PrerollRequestConfigVariant, { timeout: number; retry: number }> = {
  [PrerollRequestConfigVariant.CONTROL]: { timeout: 10_000, retry: 3 },
  [PrerollRequestConfigVariant.LONG_TIMEOUT_NO_RETRY]: { timeout: 15_000, retry: 0 },
  [PrerollRequestConfigVariant.FAST_TIMEOUT_NO_RETRY]: { timeout: 8_000, retry: 0 },
  [PrerollRequestConfigVariant.FAST_FAIL]: { timeout: 5_000, retry: 0 },
};

const webottMajorsUpdatePrerollRequestConfig: ExperimentDescriptor<{
  config_v2: 0 | 1 | 2 | 3;
}> = {
  name: 'webott_majors_update_preroll_request_config_v2',
  defaultParams: {
    config_v2: PrerollRequestConfigVariant.CONTROL,
  },
};

export default webottMajorsUpdatePrerollRequestConfig;

