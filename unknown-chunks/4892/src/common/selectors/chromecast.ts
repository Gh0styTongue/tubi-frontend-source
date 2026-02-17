import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

// chromecastCaptionsIndex will be -1 if this is the first time we cast the video
// in this case we will use the playerCaptionsIndex as the default captions index

export const getCaptionIndexSelector = createSelector(
  ({ player: { captions: { captionsIndex: playerCaptionsIndex } } }: StoreState) => playerCaptionsIndex,
  ({ chromecast: { captionsIndex: chromecastCaptionsIndex } }: StoreState) => chromecastCaptionsIndex,
  (playerCaptionsIndex, chromecastCaptionsIndex) => (chromecastCaptionsIndex >= 0 ? chromecastCaptionsIndex : playerCaptionsIndex),
);
