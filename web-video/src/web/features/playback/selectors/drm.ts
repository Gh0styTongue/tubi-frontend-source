import { DrmKeySystem } from '@adrise/player';

import { isWebWindows7, isWebWindows8 } from 'client/utils/clientTools';
import type StoreState from 'common/types/storeState';

export const drmKeySystemSelector = (state: StoreState): DrmKeySystem | undefined => {
  return state.player.drmKeySystem ?? undefined;
};

export const isDRMSupportedSelector = (state: StoreState): boolean => {
  const drmKeySystem = drmKeySystemSelector(state);
  return drmKeySystem !== DrmKeySystem.Invalid && (drmKeySystem !== DrmKeySystem.Widevine || (!isWebWindows7() && !isWebWindows8()));
};

export const isDrmKeySystemReadySelector = (state: StoreState): boolean => {
  return !!drmKeySystemSelector(state);
};
