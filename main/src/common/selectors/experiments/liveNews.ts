import { createSelector } from 'reselect';

import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import { isWebLiveNewsEnableSelector } from 'common/selectors/webLive';

export const shouldShowLinearContent = createSelector(
  shouldShowOTTLinearContentSelector,
  isWebLiveNewsEnableSelector,
  (liveNewsOTT, liveNewsWeb): boolean => {
    if (!__ISOTT__) {
      return liveNewsWeb;
    }
    return liveNewsOTT;
  });
