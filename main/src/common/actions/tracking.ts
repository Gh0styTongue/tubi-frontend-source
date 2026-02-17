/* istanbul ignore file */
import Analytics from '@tubitv/analytics';
import type { AnalyticsConfigProps } from '@tubitv/analytics/lib/baseTypes';

import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { ReduxState } from 'common/utils/analytics';
import { transformStateToAnalyticsConfig } from 'common/utils/analytics';

/**
 * initializeAnalytics: This action is used to set/update the config for the analytics package.
 *
 * If calling this from a systemApi, please make sure to pass extraCtx with additional system configuration when it is available.
 * Ex: setAnalyticsConfig({ advertiser_id: '1234' })
 */
export const setAnalyticsConfig = (extraCtx?: AnalyticsConfigProps) => {
  return (dispatch: TubiThunkDispatch, getState: () => ReduxState) => {
    const analyticsConfig = transformStateToAnalyticsConfig(getState(), extraCtx);
    Analytics.mergeConfig(() => analyticsConfig);
  };
};
