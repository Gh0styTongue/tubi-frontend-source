import { getCookie, removeCookie, setCookie } from 'client/utils/localDataStorage';
import { FORCE_FAILSAFE_EXPERIMENT_COOKIE } from 'common/constants/constants';
import forceFailsafe from 'common/experiments/config/forceFailsafe';
import type { TubiStore } from 'common/types/storeState';
import { isMajorEventFailsafeActive } from 'common/utils/remoteConfig';

export const setupForceFailsafeExperiment = (store: TubiStore) => {
  const shouldHaveCookie = forceFailsafe(store).getValue();
  const hasCookie = getCookie(FORCE_FAILSAFE_EXPERIMENT_COOKIE) != null;

  // If the major event is active, we should always have the cookie
  // cause we won't request popper to get the experiment value
  // if not, app will reload over and over
  const isMajorEventFailsafeActiveEnabled = isMajorEventFailsafeActive();

  if (shouldHaveCookie && !hasCookie) {
    setCookie(FORCE_FAILSAFE_EXPERIMENT_COOKIE, 'true');
    location.reload();
  } else if (!isMajorEventFailsafeActiveEnabled && !shouldHaveCookie && hasCookie) {
    removeCookie(FORCE_FAILSAFE_EXPERIMENT_COOKIE);
    location.reload();
  }
};
