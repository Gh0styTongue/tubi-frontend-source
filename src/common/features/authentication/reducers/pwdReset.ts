import * as actions from 'common/constants/action-types';
import type {
  PasswordResetActions,
  PasswordResetState,
} from 'common/features/authentication/types/password';

export const initialState: PasswordResetState = {
  token: null,
  loaded: false,
  loading: false,
  isValid: false,
};

export default function reducer(
  state: PasswordResetState = initialState,
  action: PasswordResetActions
): PasswordResetState {
  switch (action.type) {
    case actions.VERIFY_RESET_TOKEN:
      return {
        ...state,
        loading: true,
        token: action.token,
      };
    case actions.VERIFY_RESET_TOKEN_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        isValid: true,
        userId: action.userId,
      };
    case actions.VERIFY_RESET_TOKEN_FAIL:
      return {
        ...state,
        loading: false,
        loaded: true,
        isValid: false,
      };
    default:
      return state;
  }
}
