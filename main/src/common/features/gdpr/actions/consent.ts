import type { FetchActionTypes } from '@tubitv/refetch/lib/types';

import type { ConsentResponse } from 'common/api/consent';
import { patchConsent, getConsent } from 'common/api/consent';
import * as actions from 'common/constants/action-types';
import type { ConsentValue } from 'common/features/gdpr/types';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';

export const loadGDPRConsent: () => TubiThunkAction<{
  type: typeof actions.LOAD_GDPR_CONSENT,
  payload: () => Promise<ConsentResponse>,
}> = () => (dispatch: TubiThunkDispatch) => {
  return dispatch({
    type: actions.LOAD_GDPR_CONSENT,
    payload: () =>
      getConsent(dispatch),
  });
};
export const updateGDPRConsent: (content: Record<string, ConsentValue>) => TubiThunkAction<{
  type: FetchActionTypes;
  payload: () => Promise<unknown>;
}> = (content) => (dispatch) => {
  return dispatch({
    type: actions.UPDATE_GDPR_CONSENT,
    payload: () =>
      patchConsent(dispatch, content),
  });
};

// When user enter kids mode, we should set some preferences to false
// See: https://docs.google.com/document/d/1UIJAWHFC4h_Y33yV8aBgviDI_fUoUfwO2xCjrmmn4vY/edit#heading=h.fdoe44xwx5sp
export const setGDPRConsentForKidsMode = () =>
  ({
    type: actions.SET_GDPR_CONSENT_FOR_KIDS_MODE,
  } as const);
