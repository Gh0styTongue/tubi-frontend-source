import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import type {
  AuthThunk,
  UAPIAuthResponse,
  User,
} from 'common/features/authentication/types/auth';
import {
  processUAPIAuthError,
  processUAPIAuthResponse,
  transferUserCallback,
} from 'common/features/authentication/utils/api';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { getPlatform } from 'common/utils/platform';

const { uapi } = getConfig();

export interface TransferUserParams {
  refreshToken: string;
  userId: number;
  fromDeviceId: string;
  fromPlatform: string;
}

export const transferUser = ({
  refreshToken,
  userId,
  fromDeviceId,
  fromPlatform,
}: TransferUserParams): AuthThunk<Promise<User>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    const authType = 'UNKNOWN';
    try {
      const url = uapi.loginTransfer;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          device_id: deviceId,
          from_device_id: fromDeviceId,
          from_platform: fromPlatform,
          platform: getPlatform(),
        },
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        shouldAddAdvertiserId: true,
      };
      const initialResponse = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));

      const response = {
        ...initialResponse,
        user_id: userId,
      };

      return dispatch(
        processUAPIAuthResponse({
          authType,
          callback: transferUserCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError({
          authType,
          callback: transferUserCallback,
          err,
        })
      );
    }
  };
};
