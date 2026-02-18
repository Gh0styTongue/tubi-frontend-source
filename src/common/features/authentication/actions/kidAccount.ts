import { updateKids } from 'common/actions/userSettings';
import { getKidAccounts } from 'common/features/authentication/api/kidAccount';
import type { AuthThunk, Kid } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { userKidsSelector } from 'common/selectors/userSettings';

export const loadKidAccounts = (): AuthThunk<Promise<Kid[]>> => {
  return async (dispatch) => {
    const kids = await dispatch(getKidAccounts());
    dispatch(updateKids(kids));
    return kids;
  };
};

export const appendKidAccount = (kid: Kid): AuthThunk<Kid[]> => {
  return (dispatch, getState) => {
    const kids = userKidsSelector(getState()) || [];
    if (kids.find((k) => k.userId === kid.userId)) {
      logger.info('appendKidAccount: kid account already exists.');
      return kids;
    }
    const updatedKids = [...kids, kid];
    dispatch(updateKids(updatedKids));
    return updatedKids;
  };
};
