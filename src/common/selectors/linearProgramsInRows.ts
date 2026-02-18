import { createSelector } from 'reselect';

import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import { isWebLiveNewsEnableSelector } from 'common/selectors/webLive';

export const showLinearProgramsInRowsSelector = createSelector(
  __ISOTT__ ? shouldShowOTTLinearContentSelector : isWebLiveNewsEnableSelector,
  (isLinearContentEnabled) =>
    isLinearContentEnabled
);
