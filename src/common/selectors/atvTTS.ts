import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

const isAndroidTVNativePackageWithTTSApi = createSelector(
  (state?: StoreState) => state?.fire,
  (fire) => {
    if (!__IS_ANDROIDTV_HYB_PLATFORM__ || !fire) return false;
    // Hilton is run on Android Open Source Platform (AOSP) which does not
    // support TTS
    if (['HILTON', 'DIRECTVHOSP', 'BRIDGEWATER'].includes(__OTTPLATFORM__)) return false;
    // the TTS apis were first added in build code 557
    return (fire.appVersion.code ?? 0) >= 557;
  },
);

export default isAndroidTVNativePackageWithTTSApi;
