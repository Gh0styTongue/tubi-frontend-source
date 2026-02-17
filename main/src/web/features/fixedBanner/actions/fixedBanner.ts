import { SET_FIXED_BANNER } from 'common/constants/action-types';

import type { FixedBanner, FixedBannerAction } from '../types/fixedBanner';

export function addFixedBanner(fixedBanner: FixedBanner): FixedBannerAction {
  return {
    type: SET_FIXED_BANNER,
    bannerState: fixedBanner,
  };
}

export function removeFixedBanner(): FixedBannerAction {
  return {
    type: SET_FIXED_BANNER,
    bannerState: null,
  };
}
