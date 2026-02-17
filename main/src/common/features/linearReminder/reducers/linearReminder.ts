import { ADD_LINEAR_REMINDER, REMOVE_LINEAR_REMINDER, LOAD_LINEAR_REMINDER } from 'common/constants/action-types';

import type {
  AddLinearReminderAction,
  AddLinearReminderFailureAction,
  AddLinearReminderSuccessAction,
  FetchLinearReminderSuccessAction,
  LinearReminderAction as Action,
  LinearReminderState as State,
  RemoveLinearReminderAction,
  RemoveLinearReminderFailureAction,
  RemoveLinearReminderSuccessAction,
} from '../types/linearReminder';
import { getMapKey, getMapKeyById, tramsformReminderResponse } from '../utils/linearReminder';

export const initialState: State = {
  loaded: false,
  loading: false,
  inProgress: {},
  idMap: {},
  hasError: false,
};

export default function reducer(state: State = initialState, action = {} as Action): State {
  const { type: actionType } = action;

  if ([ADD_LINEAR_REMINDER.FETCH, ADD_LINEAR_REMINDER.SUCCESS, ADD_LINEAR_REMINDER.FAILURE].includes(actionType)) {
    const { data } = action as
      | AddLinearReminderAction
      | AddLinearReminderSuccessAction
      | AddLinearReminderFailureAction;
    const mapKey = getMapKey(data);

    if (actionType === ADD_LINEAR_REMINDER.FETCH) {
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: true,
        },
      };
    }

    if (actionType === ADD_LINEAR_REMINDER.SUCCESS) {
      const { payload } = action as AddLinearReminderSuccessAction;

      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: false,
        },
        idMap: {
          ...state.idMap,
          [mapKey]: payload.id,
        },
      };
    }

    /* istanbul ignore else */
    if (actionType === ADD_LINEAR_REMINDER.FAILURE) {
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: false,
        },
      };
    }
  }

  if (
    [REMOVE_LINEAR_REMINDER.FETCH, REMOVE_LINEAR_REMINDER.SUCCESS, REMOVE_LINEAR_REMINDER.FAILURE].includes(actionType)
  ) {
    const {
      data: { id },
    } = action as RemoveLinearReminderAction | RemoveLinearReminderSuccessAction | RemoveLinearReminderFailureAction;

    const mapKey = getMapKeyById(id, state);

    if (!mapKey) {
      return state;
    }

    if (actionType === REMOVE_LINEAR_REMINDER.FETCH) {
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: true,
        },
      };
    }

    if (actionType === REMOVE_LINEAR_REMINDER.SUCCESS) {
      const idMap = { ...state.idMap };
      delete idMap[mapKey];

      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: false,
        },
        idMap,
      };
    }

    /* istanbul ignore else */
    if (actionType === REMOVE_LINEAR_REMINDER.FAILURE) {
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [mapKey]: false,
        },
      };
    }
  }

  switch (actionType) {
    case LOAD_LINEAR_REMINDER.FETCH: {
      return {
        ...state,
        loading: true,
      };
    }

    case LOAD_LINEAR_REMINDER.SUCCESS: {
      const { payload } = action as FetchLinearReminderSuccessAction;

      return {
        ...state,
        idMap: tramsformReminderResponse(payload),
        loading: false,
        loaded: true,
        hasError: false,
      };
    }

    case LOAD_LINEAR_REMINDER.FAILURE: {
      return {
        ...state,
        loading: false,
        loaded: false,
        hasError: true,
      };
    }

    default:
      return state;
  }
}
