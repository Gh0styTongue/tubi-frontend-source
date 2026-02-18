import * as actions from 'common/constants/action-types';
import type { WrapperAction, WrapperState } from 'common/features/wrapper/type';

export const initialState: WrapperState = {
  status: 'notWatched',
  creatives: [],
};

export default function WrapperReducer(state: WrapperState = initialState, action: WrapperAction) {
  switch (action.type) {
    case actions.SET_WRAPPER_STATUS:
      return {
        ...state,
        status: action.status,
      };
    case actions.ADD_WRAPPER_CREATIVES: {
      return {
        ...state,
        creatives: action.creatives,
      };
    }
    default:
      return state;
  }
}
