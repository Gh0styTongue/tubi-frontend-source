import { createSelector } from 'reselect';

import systemApi from 'client/systemApi';
import { DEVICE_DEAL_PARAM, ISD_PARAM, RSD_PARAM, TUBI_VERSION_PARAM } from 'common/features/authentication/constants/persistedQueryParams';
import { appVersionSelector } from 'common/selectors/fireUtils';
import { deviceDealSelector, isdSelector, rsdSelector } from 'common/selectors/ottSystem';
import type { AppVersion } from 'common/types/fire';
import { convertAppVersionToAnalyticsVersion } from 'common/utils/version';

export default createSelector(
  deviceDealSelector,
  isdSelector,
  rsdSelector,
  appVersionSelector,
  (deviceDeal, isd, rsd, appVersion) => {
    const params = {
      [DEVICE_DEAL_PARAM]: deviceDeal,
      [ISD_PARAM]: isd,
      [RSD_PARAM]: rsd,
      [TUBI_VERSION_PARAM]: convertAppVersionToAnalyticsVersion(appVersion as AppVersion) || undefined,
      ...(__OTTPLATFORM__ === 'TIVO' && { ...systemApi.getTivoInfoForPersistedParams() }),
    };

    return Object.entries(params).reduce((acc, [key, value]) => {
      if (value === undefined) {
        delete acc[key];
      }
      return acc;
    }, params);
  });
