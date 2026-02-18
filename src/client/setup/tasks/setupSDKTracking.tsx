import type { History } from 'history';

import ThirdPartySDKManager from 'client/utils/thirdParty';
import type { TubiStore } from 'common/types/storeState';

export const setupSDKTracking = (store: TubiStore, history: History) => {
  ThirdPartySDKManager(store, history).load().setupTracking();
};
