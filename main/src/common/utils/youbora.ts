/**
 * @author Leo Fu
 */

import type StoreState from 'common/types/storeState';

export const getYouboraEnabled = (enabledFn: (store: StoreState) => boolean) => (store: StoreState) => {
  return !!enabledFn(store);
};
