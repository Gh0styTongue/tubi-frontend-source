import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import { FREEZED_EMPTY_ARRAY } from 'common/constants/constants';
import type { ParentalRating } from 'common/constants/ratings';
import type { AuthThunk, Kid, KidAPIResponse } from 'common/features/authentication/types/auth';
import { formatUserAPIResponse } from 'common/features/authentication/utils/user';
import logger from 'common/helpers/logging';

const config = getConfig();
const { uapi: { accountService } } = config;

const KIDS_ACCOUNT_ENDPOINT = `${accountService}/accounts/kids`;

interface AddKidAccountPayload {
  activation_code: string;
  name: string;
  parental_rating: ParentalRating;
  pin: string;
}

export const addKidAccount = (payload: AddKidAccountPayload): AuthThunk<Promise<Kid>> => {
  return async (dispatch) => {
    try {
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          ...payload,
        },
      };
      const response = await dispatch(fetchWithToken<KidAPIResponse>(KIDS_ACCOUNT_ENDPOINT, options));
      return formatUserAPIResponse(response) as Kid;
    } catch (err) {
      logger.error({ error: err, errorMessage: err.message }, 'error on adding kid account');
      return Promise.reject(err);
    }
  };
};

interface GetKidAccountsResponse {
  kids: KidAPIResponse[];
}

export const getKidAccounts = (): AuthThunk<Promise<Kid[]>> => {
  return async (dispatch) => {
    try {
      const options: FetchWithTokenOptions = {
        method: 'get',
      };
      const response = await dispatch(fetchWithToken<GetKidAccountsResponse>(KIDS_ACCOUNT_ENDPOINT, options));
      if (response?.kids && response.kids.length > 0) {
        return response.kids.map(formatUserAPIResponse) as Kid[];
      }
      return FREEZED_EMPTY_ARRAY;
    } catch (err) {
      logger.error({ error: err, errorMessage: err.message }, 'error when getting kid accounts');
      return FREEZED_EMPTY_ARRAY;
    }
  };
};

interface UpdateKidAccountPayload {
  tubi_id: string;
  name?: string;
  parental_rating?: number;
  password?: string;
}

export const updateKidAccount = (payload: UpdateKidAccountPayload): AuthThunk<Promise<Kid>> => {
  return async (dispatch) => {
    try {
      const options: FetchWithTokenOptions = {
        method: 'patch',
        data: {
          ...payload,
        },
      };
      const response = await dispatch(fetchWithToken<KidAPIResponse>(KIDS_ACCOUNT_ENDPOINT, options));
      return formatUserAPIResponse(response) as Kid;
    } catch (err) {
      const { password, ...rest } = payload;
      logger.error(
        { error: err, errorMessage: err.message, payload: { ...rest, redactedHasPassword: !!password } },
        'error when updating kid account'
      );
      throw err;
    }
  };
};

export interface DeleteKidAccountPayload {
  tubi_id: string;
  password: string;
  reasons: string[];
  other?: string;
}

export const deleteKidAccount = (payload: DeleteKidAccountPayload): AuthThunk<Promise<void>> => {
  return (dispatch) => {
    const options: FetchWithTokenOptions = {
      method: 'del',
      data: {
        ...payload,
      },
    };
    return dispatch(fetchWithToken<void>(KIDS_ACCOUNT_ENDPOINT, options)).catch(err => {
      const { password, ...rest } = payload;
      logger.error(
        { error: err, errorMessage: err.message, payload: { ...rest, redactedHasPassword: !!password } },
        'error when deleting kid account',
      );
      return Promise.reject(err);
    });
  };
};

interface ValidateResponse {
  valid: boolean;
}
export const validatePIN = (pin: string): AuthThunk<Promise<ValidateResponse>> =>
  async (dispatch) => {
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        pin,
      },
    };

    try {
      return await dispatch(fetchWithToken<ValidateResponse>(`${accountService}/accounts/kids/pin/validate`, options));
    } catch (error) {
      logger.error({ error, errorMessage: error.message }, 'Failed to validate PIN');
      return Promise.reject(error);
    }
  };

export const validatePassword = (password: string): AuthThunk<Promise<ValidateResponse>> =>
  async (dispatch) => {
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        password,
      },
    };

    try {
      return await dispatch(fetchWithToken<ValidateResponse>(`${accountService}/accounts/password/validate`, options));
    } catch (error) {
      logger.error({ error, errorMessage: error.message }, 'Failed to validate password');
      return Promise.reject(error);
    }
  };

interface CreatePINPayload {
  pin: string;
  password: string;
}

export const createPIN = ({ pin, password }: CreatePINPayload): AuthThunk<Promise<void>> =>
  async (dispatch) => {
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        pin,
        password,
      },
    };

    try {
      return await dispatch(fetchWithToken<void>(`${accountService}/accounts/kids/pin`, options));
    } catch (error) {
      logger.error({ error, errorMessage: error.message }, 'Failed to create PIN');
      return Promise.reject(error);
    }
  };
