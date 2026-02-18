import Analytics from '@tubitv/analytics';
import jwtDecode from 'jwt-decode';

import * as actions from 'common/constants/action-types';
import { NOT_SPECIFIED } from 'common/constants/constants';
import type { SetTubiIdAction, AuthThunk } from 'common/features/authentication/types/auth';
import { logTubiIdError } from 'common/utils/log';
import { getAnonymousTokenFromStorage, syncAnonymousTokensClient } from 'common/utils/token';

interface TokenWithTubiId {
  tubi_id: string;
}

interface DecodeTokenAndSetTubiIdParams {
  accessToken: string;
  errorMessage?: string;
}

export const setTubiId = (tubiId?: string): SetTubiIdAction => {
  Analytics.mergeConfig({
    tubi_id: tubiId || NOT_SPECIFIED,
  });
  return {
    type: actions.SET_TUBI_ID,
    tubiId,
  };
};

export const removeTubiId = (): SetTubiIdAction => {
  return {
    type: actions.SET_TUBI_ID,
    tubiId: undefined,
  };
};

export const decodeTokenAndSetTubiId = <T extends TokenWithTubiId = TokenWithTubiId>({
  accessToken,
  errorMessage = 'Failed to decode anonymous access token',
}: DecodeTokenAndSetTubiIdParams): AuthThunk<void> => {
  return (dispatch) => {
    try {
      const decodedAccessToken = jwtDecode<T>(accessToken);
      dispatch(setTubiId(decodedAccessToken.tubi_id));
    } catch (error) {
      logTubiIdError({
        error,
        message: errorMessage,
      });
    }
  };
};

export const syncAnonymousTokensAndSetTubiId = (): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    await syncAnonymousTokensClient();
    const anonAccessToken = getAnonymousTokenFromStorage();

    if (anonAccessToken) {
      dispatch(
        decodeTokenAndSetTubiId({
          accessToken: anonAccessToken,
        })
      );
    } else {
      logTubiIdError({
        message: 'Failed to get anonymous token with syncAnonymousTokensAndSetTubiId',
      });
    }
  };
};
