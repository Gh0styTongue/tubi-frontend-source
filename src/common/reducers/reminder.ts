import * as actions from 'common/constants/action-types';
import type { ReminderState, ReminderAction } from 'common/types/reminder';

export const initialState: ReminderState = {
  loaded: false,
  loading: false,
  inProgress: {},
  contentIdMap: {},
  hasError: false,
};

export default function Reminder(state: ReminderState = initialState, action: ReminderAction) {
  const contentId = action.contentId || '';

  switch (action.type) {
    case actions.ADD_TO_REMINDER.FETCH:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: true,
        },
      };
    case actions.ADD_TO_REMINDER.SUCCESS:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: {
            id: action.payload.id,
            contentType: action.payload.content_type,
          },
        },
      };
    case actions.ADD_TO_REMINDER.FAILURE:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
      };
    case actions.LOAD_REMINDER.FETCH:
      return {
        ...state,
        loading: true,
        loaded: false,
        hasError: false,
      };
    case actions.LOAD_REMINDER.SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        contentIdMap: {
          ...action.payload.dataMap,
        },
        hasError: false,
      };
    case actions.LOAD_REMINDER.FAILURE:
      return {
        ...state,
        loaded: false,
        loading: false,
        hasError: true,
      };
    case actions.REMOVE_FROM_REMINDER.FETCH:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: true,
        },
      };
    case actions.REMOVE_FROM_REMINDER.SUCCESS:
      if (!state.contentIdMap[contentId]) return state;
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
        contentIdMap: {
          ...state.contentIdMap,
          [contentId]: false,
        },
      };
    case actions.REMOVE_FROM_REMINDER.FAILURE:
      return {
        ...state,
        inProgress: {
          ...state.inProgress,
          [contentId]: false,
        },
      };
    default:
      return state;
  }
}
