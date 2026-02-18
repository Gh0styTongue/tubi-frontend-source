import { days, secondsRemainingToday, secs } from '@adrise/utils/lib/time';

import { setCookie } from 'client/utils/localDataStorage';
import { DISMISSED_PERSONALIZATION_PROMPT, IS_VALID_USER_FOR_PERSONALIZATION } from 'common/constants/cookies';
import type { TubiThunkAction } from 'common/types/reduxThunk';

import * as actionTypes from '../constants/action-types';

export function setDismissedPrompt(payload: boolean) {
  return {
    type: actionTypes.SET_DISMISSED_PERSONALIZATION_PROMPT,
    payload,
  };
}

export function persistDismissedPrompt(payload: boolean): TubiThunkAction {
  setCookie(DISMISSED_PERSONALIZATION_PROMPT, String(payload), secondsRemainingToday());
  return (dispatch) => {
    dispatch(setDismissedPrompt(payload));
  };
}

export function setIsValidUserForPersonalization(payload: boolean) {
  return {
    type: actionTypes.SET_IS_VALID_USER_FOR_PERSONALIZATION,
    payload,
  };
}

export function persistIsValidUserForPersonalization(payload: boolean): TubiThunkAction {
  setCookie(IS_VALID_USER_FOR_PERSONALIZATION, String(payload), days(7) / secs(1));
  return (dispatch) => {
    dispatch(setIsValidUserForPersonalization(payload));
  };
}
