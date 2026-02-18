import { SET_FIXED_BANNER } from 'common/constants/action-types';

import type { FixedBannerAction, FixedBannerState } from '../types/fixedBanner';

export const initialState: FixedBannerState = {
  bannerState: null,
};

export default function reducer(state: FixedBannerState = initialState, action = {} as FixedBannerAction): FixedBannerState {
  switch (action.type) {
    case SET_FIXED_BANNER:
      return {
        ...state,
        bannerState: action.bannerState,
      };
    default:
      return state;
  }
}
