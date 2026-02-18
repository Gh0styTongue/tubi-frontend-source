import { isEmpty } from 'lodash';

import * as actions from 'common/constants/action-types';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import { fireTrackingPixel } from 'common/utils/fireTrackingPixel';

import { wrapperCustomSelector } from './selector';
import type { AddWrapperCreativesAction, Ads, SetWrapperStatusAction } from './type';
import { trackWrapperError } from './utils';

export const addWrapperCreatives = (ads: Ads[] = []): AddWrapperCreativesAction => {
  return {
    type: actions.ADD_WRAPPER_CREATIVES,
    creatives: ads[0]?.creatives || [],
  };
};

export const watchedWrapper = (): SetWrapperStatusAction => {
  return {
    type: actions.SET_WRAPPER_STATUS,
    status: 'watched',
  };
};

export function fireWrapperPixels(type: 'image_imptracking' | 'click_trackings'): TubiThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const pixelUrls = (wrapperCustomSelector(state) ?? {})[type];
    if (isEmpty(pixelUrls)) {
      trackWrapperError(`No ${type} pixel URLs found`);
      return;
    }
    pixelUrls?.forEach(url => fireTrackingPixel(url));
  };
}
