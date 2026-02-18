import { createSelector } from 'reselect';

import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTENT_MODES } from 'common/constants/constants';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { getExperiment } from 'common/experimentV2';
import { VIDEO_TILES_VALUE as VALUE, webottMajorPlatformsHomegridVideoTiles } from 'common/experimentV2/configs/webottMajorPlatformsHomegridVideoTiles';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import type { StoreState } from 'common/types/storeState';

const ottHomegridVideoTilesSelector = (_state: StoreState) => {
  return __ISOTT__ ? getExperiment(webottMajorPlatformsHomegridVideoTiles).get('type') : VALUE.CONTROL;

};

export const videoTilesSelector = createSelector(
  ottHomegridVideoTilesSelector,
  isKidsModeEnabledSelector,
  (_: StoreState, { pathname }: { pathname: string; }) => pathname,
  (value, isKidsMode, pathname): VALUE => {
    if (pathname !== OTT_ROUTES.home || isKidsMode) {
      return VALUE.CONTROL;
    }
    return value;
  }
);

export const videoTilesSelectorForContentMode = createSelector(
  ottHomegridVideoTilesSelector,
  isKidsModeEnabledSelector,
  (_: StoreState, { contentMode }: { contentMode: CONTENT_MODE_VALUE }) => contentMode,
  (value, isKidsMode, contentMode): VALUE => {
    if (contentMode === CONTENT_MODES.all) {
      return videoTilesSelector.resultFunc(value, Boolean(isKidsMode), __ISOTT__ ? OTT_ROUTES.home : WEB_ROUTES.home);
    }
    return VALUE.CONTROL;
  }
);
