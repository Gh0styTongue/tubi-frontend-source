import { USER_NOT_FOUND_ERROR, LOGIN_REQUIRED_ERROR } from 'common/features/authentication/constants/auth';

// When the account is deleted, the client will expect to receive 401 status code
// and "USER_NOT_FOUND" code in the response payload. For details, please refer to
// https://www.notion.so/tubi/Client-behavior-for-deregistered-users-029dbc90739f437f9d7b55d95ce3663d?pvs=4#a38c24a8ab684944a21279bb1acf5b49
export const isUserNotFound = (statusCode: number, code?: string) => {
  return statusCode === USER_NOT_FOUND_ERROR.STATUS_CODE && code === USER_NOT_FOUND_ERROR.CODE;
};

export const isLoginRequired = (statusCode: number, code?: string) => {
  return statusCode === LOGIN_REQUIRED_ERROR.STATUS_CODE && code === LOGIN_REQUIRED_ERROR.CODE;
};
