import type { UserReactionsAction } from 'common/actions/userReactions';
import {
  LOGOUT_SUCCESS,
  LOAD_SINGLE_TITLE_REACTION_SUCCESS,
  ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS,
  ADD_REACTION_FOR_MULTI_TITLES_SUCCESS,
  REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS,
} from 'common/constants/action-types';
import type { AuthAction } from 'common/features/authentication/types/auth';
import type { OtherAction } from 'common/types/reduxHelpers';
import type { UserReactionsState } from 'common/types/userReactions';

export const initialState: UserReactionsState = {
  content: {},
};

export default function userReactions(
  state: UserReactionsState = initialState,
  action: AuthAction | UserReactionsAction | OtherAction
): UserReactionsState {
  switch (action.type) {
    case LOAD_SINGLE_TITLE_REACTION_SUCCESS:
      return {
        ...state,
        content: {
          ...state.content,
          [action.contentId]: { status: action.status },
        },
      };
    case ADD_REACTION_FOR_SINGLE_TITLE_SUCCESS:
      return {
        ...state,
        content: {
          ...state.content,
          [action.contentId]: { status: action.reaction === 'like' ? 'liked' : 'disliked' },
        },
      };
    case ADD_REACTION_FOR_MULTI_TITLES_SUCCESS:
      const content = { ...state.content };
      action.contentIds.forEach((contentId) => {
        content[contentId] = { status: action.reaction === 'like' ? 'liked' : 'disliked' };
      });
      return {
        ...state,
        content,
      };
    case REMOVE_REACTION_FOR_SINGLE_TITLE_SUCCESS:
      return {
        ...state,
        content: {
          ...state.content,
          [action.contentId]: { status: 'none' },
        },
      };
    case LOGOUT_SUCCESS:
      return initialState;
    default:
      return state;
  }
}
