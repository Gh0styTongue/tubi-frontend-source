import { memoize } from 'lodash';

import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { AdBreaks } from 'common/types/video';

// allow for ad break every 30 seconds during first hour
const AD_BREAK_SPACING_SEC = 30;
const SECONDS_TO_HAVE_A_LOT_OF_ADS = 3600; // 1 hour

export const maybeOverrideCuePoints = memoize((adBreaks: AdBreaks = []): AdBreaks => {
  if (FeatureSwitchManager.isEnabled(['Ad', 'AllTheAds'])) {
    const overriddenAdBreaks = [];
    for (let i = 0; i <= SECONDS_TO_HAVE_A_LOT_OF_ADS; i += AD_BREAK_SPACING_SEC) {
      overriddenAdBreaks.push(i);
    }
    return overriddenAdBreaks;
  }
  if (FeatureSwitchManager.get(['Ad', 'Availability']) === 'removeCuePoint0') {
    return adBreaks.filter((adBreak) => adBreak !== 0);
  }
  return adBreaks;
});
