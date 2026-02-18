import { isEmpty } from 'lodash';

import * as actions from 'common/constants/action-types';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import { fireTrackingPixel } from 'common/utils/fireTrackingPixel';

import { skinsAdCustomSelector } from './selector';
import type { AddSkinsAdCreativesAction, Ads, SetSkinsAdStatusAction } from './type';
import { trackSkinsAdError } from './utils';

export const addSkinsAdCreatives = (ads: Ads[] = []): AddSkinsAdCreativesAction => {
  return {
    type: actions.ADD_SKINS_AD_CREATIVES,
    creatives: ads[0]?.creatives || [],
  };
};

export const watchedSkinsAd = (): SetSkinsAdStatusAction => {
  return {
    type: actions.SET_SKINS_AD_STATUS,
    status: 'watched',
  };
};

export function fireSkinsAdPixels(type: 'image_imptracking' | 'click_trackings'): TubiThunkAction {
  return (dispatch, getState, client) => {
    const state = getState();
    const pixelUrls = (skinsAdCustomSelector(state) ?? {})[type];
    if (isEmpty(pixelUrls)) {
      trackSkinsAdError(`No ${type} pixel URLs found`);
      return;
    }
    pixelUrls?.forEach(url => fireTrackingPixel(client, url));
  };
}
