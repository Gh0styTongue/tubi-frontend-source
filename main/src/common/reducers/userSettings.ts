import * as actions from 'common/constants/action-types';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import type {
  UserSettingsAction,
  UserSettingsState,
} from 'common/types/userSettings';

export const initialState: UserSettingsState = {
  birthday: '',
  loaded: false,
  deleteSuccess: false,
  deleteError: null,
  loadError: null,
  facebookId: null,
  email: '',
  first_name: '',
  gender: null,
  profilePic: undefined,
  enabled: false,
  hasPassword: false,
  coppaState: UserCoppaStates.COMPLIANT,
  parentalRating: 3,
  notification_settings: {
    newsletter: false,
    content_leaving: false,
  },
};

export default function userSettingsReducer(
  state: UserSettingsState = initialState,
  action?: UserSettingsAction,
): UserSettingsState {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.LOAD_SETTINGS: {
      return {
        ...state,
        loaded: false,
      };
    }
    case actions.LOAD_SETTINGS_SUCCESS:
      return {
        ...state,
        loaded: true,
        loadError: null,
        ...action.result,
      };
    case actions.LOAD_SETTINGS_FAIL:
      return {
        ...state,
        loaded: false,
        loadError: action.error.message,
      } as unknown as UserSettingsState;
    case actions.UPDATE_SETTINGS_SUCCESS:
      return {
        ...state,
        ...action.result,
      };
    case actions.SET_PARENTAL_RATING:
      return {
        ...state,
        parentalRating: action.rating,
      };
    case actions.UPDATE_PARENTAL_SUCCESS:
      return {
        ...state,
        parentalRating: action.result,
      } as unknown as UserSettingsState;
    case actions.DELETE_ACCOUNT:
      return {
        ...state,
        deleteSuccess: false,
      };
    case actions.DELETE_ACCOUNT_FAIL:
      return {
        ...state,
        deleteError: action.error.message,
      } as unknown as UserSettingsState;
    case actions.DELETE_ACCOUNT_SUCCESS:
      return {
        ...state,
        deleteError: null,
        deleteSuccess: true,
      };
    case actions.CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        hasPassword: true,
      };
    case actions.LOGOUT_SUCCESS:
      // Use default settings once user has logged out
      return initialState;
    case actions.SET_COPPA_STATE:
      return {
        ...state,
        coppaState: action.coppaState,
      };
    default: {
      return state;
    }
  }
}
