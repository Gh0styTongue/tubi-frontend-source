import { loadHomeScreen } from 'common/actions/container';
import { HOME_DATA_SCOPE } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import OttFireTVRTU, { FIRETV_RTU } from 'common/experiments/config/ottFireTVRTU';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import type { TubiStore } from 'common/types/storeState';

export const needLoadHomeScreenInParallel = (pathname: string) => {
  return (
    __ISOTT__ &&
    __IS_FAILSAFE__ &&
    OttFireTVRTU().getValue() === FIRETV_RTU.CONTROL && // disabled for variant group
    __OTTPLATFORM__ !== 'TIZEN' &&
    (pathname === OTT_ROUTES.home || pathname.startsWith(OTT_ROUTES.onboarding.split(':')[0]))
  );
};

export const setupHomeScreen = async (store: TubiStore) => {
  const location = tubiHistory.getCurrentLocation();
  if (
    needLoadHomeScreenInParallel(location.pathname)
  ) {
    await store
      .dispatch(
        loadHomeScreen({
          scope: HOME_DATA_SCOPE.firstScreen,
          location,
        })
      )
      .catch((error) => {
        logger.error(error, 'Failed to load homescreen before route match');
      });
  }
};
