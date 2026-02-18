import { getCookieCrossPlatform, setCookie } from 'client/utils/localDataStorage';
import { NUM_SECONDS_IN_FIFTY_YEARS } from 'common/constants/constants';
import { setFirstSeen as setFirstSeenAction } from 'common/features/authentication/actions/auth';
import logger from 'common/helpers/logging';
import type { TubiStore } from 'common/types/storeState';
import { isValidDateString } from 'common/utils/date';

const setFirstSeen = (store: TubiStore, firstSeen: string, { persist = true }: { persist?: boolean } = {}) => {
  if (persist) {
    setCookie('firstSeen', firstSeen, NUM_SECONDS_IN_FIFTY_YEARS);
  }
  store.dispatch(setFirstSeenAction(firstSeen));
};

export const setupFirstSeen = async (store: TubiStore) => {

  let firstSeen;
  try {
    firstSeen = await getCookieCrossPlatform('firstSeen');
  } catch {
    setFirstSeen(store, new Date().toISOString(), { persist: false });
    return;
  }

  if (firstSeen && !isValidDateString(firstSeen)) {
    logger.error(`Invalid firstSeen cookie provided: ${firstSeen}`);
    firstSeen = undefined;
  }

  if (!firstSeen) {
    setFirstSeen(store, new Date().toISOString());
  } else if (firstSeen !== store.getState().auth.firstSeen) {
    // For failsafe mode, sync the firstSeen cookie to the store
    setFirstSeen(store, firstSeen);
  }
};
