import { createSelector } from 'reselect';

import getApiConfig from 'common/apiConfig';
import logger from 'common/helpers/logging';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type StoreState from 'common/types/storeState';
import { transformStateToAnalyticsConfig } from 'common/utils/analytics';

import type { ExperimentDescriptor } from './configs/types';

export const STATSIG_API_HOST = `${getApiConfig().statsigPrefix}/v1`;

const statsigClientSDKKeys: Record<typeof __OTTPLATFORM__ | typeof __WEBPLATFORM__, string> = {
  FIRETV_HYB: 'client-MZe3J2rl3OqPRVIvobtKw7ubD8JJpP9LPM7b6subMAT',
  WEB: 'client-Vv5EpNlBu7QiMcES6OEXUEhYFSbiCvf5EppAiKyCYe1',
  COX: 'client-W2IrKekbk0fFDjsq57vbRdnabMR1f6UfWjm4QY9he9i',
  ANDROIDTV: 'client-GwN9Of9p5u8hVK0wGoz5k2BtKzs1L3mk4pRfbLmDB9F',
  COMCAST: 'client-D7u2uzep3pbqs6kY8bz0YXNLAQOItHDgKeF3VKA2X8f',
  DIRECTVHOSP: 'client-8YV4evl1cypB7OupGrgWBIR1K4rdPFaJY0Sa0g6xVO2',
  VIZIO: 'client-4MPCYb4CUANnhfg65NfCqZ5ub4Jc8nG4XWs9go67jSn',
  SONY: 'client-6K75U2hIKb5l30BQOcpOkLXXvuOeQX0dWXomYAENfvm',
  TIZEN: 'client-iXXhxkRPC3eqqsT5QqpCihbt58ViT8Se7BfQ7e47xIW',
  EETV: 'client-lXBFEc8tmHCScqY4JzVuwQtNUjIQ7DQKuMYZFKT6SpC',
  BRIDGEWATER: 'client-3gVf0g3TfF7E2rG60zjLNWczXRfEILem5nr4hWopUJq',
  VERIZONTV: 'client-yRX7gDGbBi2UQoWZEAdT3O2oxeTBEaKxL5UGAU4dy2w',
  TIVO: 'client-aRO7b9ma8IKkizIyd4f8aaoTjFYCcixYIISojBlxm45',
  XBOXONE: 'client-8uoK8D7893hpXPMfwG1ylHIFtSkvO7Hb99bHOJgEAM9',
  COMCASTHOSP: 'client-971tk4O8SyvtqWTeCRqBCgnspd9UMGxtRZ2SLeOCqpG',
  WINDOWS: 'client-aI5he9o3fLtvQOYrO6raXnz9c05BldAVMDkMErWD60A',
  LGTV: 'client-8vfNw3DRX0Uz73gdobrHDqIdpDi8cAbEgxCl4ug4iHz',
  PS5: 'client-T4LSNxbjqgijqtJVU1YyBCAQhjGoYRGiVrwYagidwQs',
  NETGEM: 'client-h0EEXrWZVWfflFYMP5dvs92KhjNNYpJo7h6sO9kPwWh',
  ROGERS: 'client-CMJ5QaKhUz4GXvPylFZcyfzAfFW8wToQL1WuA9ganrA',
  VIRGINMEDIA: 'client-KwwnOiHNV39tq3zNwHMH6lgOnS9bh2CJkBL51gCuwn8',
  HILTON: 'client-IQP45QVAGkUkBC83YXHcmdgLSc3UiC4gCimgLhsjOcw',
  PS4: 'client-66hW9IS1jRH7XLBU4Lsvw43dZ7U6hSmwDmNnJhxBNzm',
  SHAW: 'client-tf44afqBe8smzUJGprFAVvalpfeVLZbMRC1fHH5I2y',
  TITANOS: 'client-yRvMYHNOHoWNiD2bL4PCEXA9X7EVEUiGHoGGkXrFG6o',
  HISENSE: 'client-dsY1eS5hRET3DKr04JUbeQMKAUTtbWfKB7imENWZ6BV',
};

/* istanbul ignore next */
export const STATSIG_CLIENT_SDK_KEY = __TESTING__ ? statsigClientSDKKeys.FIRETV_HYB : statsigClientSDKKeys[__OTTPLATFORM__ || __WEBPLATFORM__];

export interface ExperimentOptions {
  disableExposureLog?: boolean;
  user?: ExperimentUser;
}

export type GetExperiment = <TParams extends Record<string, unknown>>(
  experiment: ExperimentDescriptor<TParams>,
  options?: ExperimentOptions
) => {
  get: <K extends keyof TParams>(key: K) => TParams[K];
  isInExperiment: boolean;
  value: TParams;
};

export const getEnvironment = () => {
  if (__DEVELOPMENT__) {
    return 'development';
  }
  if (__STAGING__ || __IS_ALPHA_ENV__) {
    return 'staging';
  }
  return 'production';
};

export const experimentUserSelector = createSelector(
  deviceIdSelector,
  (state: StoreState) => state.ui.twoDigitCountryCode,
  (state: StoreState) => {
    const { user_id, locale, ...rest } = transformStateToAnalyticsConfig(state);
    return {
      ...locale,
      ...rest,
    };
  },
  (deviceID, country, analyticsConfig) => {
    if (!deviceID) {
      logger.error('Device ID is empty when getting experiment user');
    }
    return {
      country,
      customIDs: {
        device_id: deviceID!,
      },
      custom: {
        ...analyticsConfig,
      },
      ip: '', // We should NOT send the IP address to Statsig
    };
  }
);

export type ExperimentUser = ReturnType<typeof experimentUserSelector>;
