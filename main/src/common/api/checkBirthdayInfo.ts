import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { ApiClientMethodOptions } from 'common/helpers/ApiClient';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

type CheckBirthdayInfoResponseBody = {
  has_age: boolean;
};

export const fetchBirthdayInfo = (dispatch: TubiThunkDispatch, options: ApiClientMethodOptions = {}): Promise<CheckBirthdayInfoResponseBody> =>
  dispatch(
    fetchWithToken<CheckBirthdayInfoResponseBody>(
      `${getConfig().accountServicePrefix}/user/check_birthday_info`,
      options
    )
  );
