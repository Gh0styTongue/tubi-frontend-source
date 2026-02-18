import { deleteLinearReminder, getLinearReminders, postLinearReminder } from 'common/api/linearReminder';
import { ADD_LINEAR_REMINDER, REMOVE_LINEAR_REMINDER, LOAD_LINEAR_REMINDER } from 'common/constants/action-types';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';

import { isLoadingSelector, isLoadedSelector } from '../selectors/linearReminder';
import type { AddReminderData, RemoveReminderData } from '../types/linearReminder';

export const addLinearReminder = (data: AddReminderData) => {
  return (dispatch: TubiThunkDispatch, _getState: () => StoreState) => {
    return dispatch({
      type: ADD_LINEAR_REMINDER,
      data,
      payload: () =>
        postLinearReminder(dispatch, data).catch((err) => {
          logger.error(err, `addLinearReminder failed. data: ${JSON.stringify(data)}`);
          return Promise.reject(err);
        }),
    });
  };
};

export const removeLinearReminder = (data: RemoveReminderData) => {
  return (dispatch: TubiThunkDispatch, _getState: () => StoreState) => {
    const { id } = data;

    return dispatch({
      type: REMOVE_LINEAR_REMINDER,
      data,
      payload: () =>
        deleteLinearReminder(dispatch, id).catch((err) => {
          logger.error(err, `removeLinearReminder failed. id: ${id}`);
          return Promise.reject(err);
        }),
    });
  };
};

export const fetchLinearReminders = () => (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
  const state = getState();

  if (!isLoggedInSelector(state) || isLoadingSelector(state) || isLoadedSelector(state)) {
    return Promise.resolve();
  }

  return dispatch({
    type: LOAD_LINEAR_REMINDER,
    payload: () =>
      getLinearReminders(dispatch).catch((err) => {
        logger.error(err, 'fetchLinearReminders failed.');
        return Promise.reject(err);
      }),
  });
};
