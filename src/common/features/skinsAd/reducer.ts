import * as actions from 'common/constants/action-types';
import type { SkinsAdAction, SkinsAdState } from 'common/features/skinsAd/type';

export const initialState: SkinsAdState = {
  status: 'notWatched',
  creatives: [],
};

export default function SkinsAdReducer(state: SkinsAdState = initialState, action: SkinsAdAction) {
  switch (action.type) {
    case actions.SET_SKINS_AD_STATUS:
      return {
        ...state,
        status: action.status,
      };
    case actions.ADD_SKINS_AD_CREATIVES: {
      return {
        ...state,
        creatives: action.creatives,
      };
    }
    default:
      return state;
  }
}
