import { BROADCAST_CHANNEL_NAMES, BROADCAST_CHANNEL_EVENTS } from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { TubiStore } from 'common/types/storeState';

const syncLoginStatus = (store: TubiStore) => {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  const isLoggedIn = isLoggedInSelector(store.getState());
  // eslint-disable-next-line compat/compat
  const broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAMES.WEB);

  broadcastChannel.postMessage({ type: BROADCAST_CHANNEL_EVENTS.LOGIN_STATUS_CHANGE, isLoggedIn });
};

export default syncLoginStatus;
