import jwtDecode from 'jwt-decode';

import { setTubiId } from 'common/features/authentication/actions/tubiId';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { logTubiIdError } from 'common/utils/log';

interface TokenWithTubiId {
  tubi_id: string;
}

interface DecodeTokenAndSetTubiIdParams {
  accessToken: string;
  dispatch: TubiThunkDispatch;
  errorMessage?: string;
}

export const decodeTokenAndSetTubiId = <T extends TokenWithTubiId = TokenWithTubiId>({
  accessToken,
  dispatch,
  errorMessage = 'Failed to decode anonymous access token',
}: DecodeTokenAndSetTubiIdParams) => {
  try {
    const decodedAccessToken = jwtDecode<T>(accessToken);
    return dispatch(setTubiId(decodedAccessToken.tubi_id));
  } catch (error) {
    logTubiIdError({
      error,
      message: errorMessage,
    });
  }
};
