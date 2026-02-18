import pick from 'lodash/pick';

import { STORE_USER_FIELDS } from 'common/constants/constants';
import type { User } from 'common/features/authentication/types/auth';

/**
 * filter user object, and only expose whitelisted fields to client side user object
 * @param user
 */
export const getClientUser = (userObj: Express.User): User => {
  const whiteListUserFields: string[] = [...STORE_USER_FIELDS];

  // use the correct field for saving user data into redux - expect user.token
  const { accessToken, ...user } = userObj;
  if (accessToken && !user.token) {
    user.token = accessToken;
  }

  return pick(user, whiteListUserFields) as User;
};
