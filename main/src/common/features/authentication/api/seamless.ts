import omit from 'lodash/omit';

import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type { AuthThunk } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { getStubiosHostname } from 'web/features/authentication/utils/auth';

const config = getConfig();
const { accountServiceUserPrefix } = config;

/**
 * Navigate to Stubios with seamless authentication token
 * was /oz/seamless/external/:target (from src/server/routes/seamless.ts)
 */
export const navigateToStubios = (link: string): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const { user } = state.auth;

    if (!user) {
      return;
    }

    const { hostname } = new URL(link);
    const stubiosHostname = getStubiosHostname();

    if (hostname !== stubiosHostname) {
      return;
    }

    const url = `${accountServiceUserPrefix}/seamless/exchange`;
    const reqData = {
      original: 'tubi',
      target: 'stubios',
      token: user.refreshToken,
      link,
    };
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: reqData,
      errorLog: false,
    };

    try {
      const response = await dispatch(fetchWithToken<{ link: string }>(url, options));
      window.open(response.link);
    } catch (err) {
      logger.error(
        {
          err: err || options,
          reqData: omit(reqData, ['token']),
        },
        'Error when calling seamless exchange'
      );
    }
  };
};
