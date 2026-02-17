import type { ADD_LINEAR_REMINDER, REMOVE_LINEAR_REMINDER, LOAD_LINEAR_REMINDER } from 'common/constants/action-types';

interface ReminderRecord {
  id: string;
  content_id: number;
  schedule_id: number;
  created_at: string;
}

export interface ReminderResponse {
  records: ReminderRecord[];
}

export interface AddReminderData extends Record<string, unknown> {
  contentId: number;
  scheduleId: number;
  startTime: string;
}

export interface RemoveReminderData {
  id: string;
}

export interface LinearReminderState {
  loaded: boolean;
  loading: boolean;
  inProgress: Record<string, boolean>;
  idMap: Record<string, string>;
  hasError: boolean;
}

export interface AddLinearReminderAction {
  type: typeof ADD_LINEAR_REMINDER.FETCH;
  data: AddReminderData;
}

export interface AddLinearReminderFailureAction extends AddLinearReminderAction {
  type: typeof ADD_LINEAR_REMINDER.FAILURE;
}

export interface AddLinearReminderSuccessAction extends AddLinearReminderAction {
  type: typeof ADD_LINEAR_REMINDER.SUCCESS;
  payload: ReminderRecord;
}

export interface RemoveLinearReminderAction {
  type: typeof REMOVE_LINEAR_REMINDER.FETCH;
  data: RemoveReminderData;
}

export interface RemoveLinearReminderFailureAction extends RemoveLinearReminderAction {
  type: typeof REMOVE_LINEAR_REMINDER.FAILURE;
}

export interface RemoveLinearReminderSuccessAction extends RemoveLinearReminderAction {
  type: typeof REMOVE_LINEAR_REMINDER.SUCCESS;
}

interface FetchLinearReminderAction {
  type: typeof LOAD_LINEAR_REMINDER.FETCH;
}

export interface FetchLinearReminderSuccessAction extends FetchLinearReminderAction {
  type: typeof LOAD_LINEAR_REMINDER.SUCCESS;
  payload: ReminderResponse;
}

interface FetchLinearReminderFailureAction extends FetchLinearReminderAction {
  type: typeof LOAD_LINEAR_REMINDER.FAILURE;
}

export type LinearReminderAction =
  | AddLinearReminderAction
  | AddLinearReminderFailureAction
  | AddLinearReminderSuccessAction
  | RemoveLinearReminderAction
  | RemoveLinearReminderFailureAction
  | RemoveLinearReminderSuccessAction
  | FetchLinearReminderAction
  | FetchLinearReminderSuccessAction
  | FetchLinearReminderFailureAction;

export type GenMapKeyParams = Pick<AddReminderData, 'contentId' | 'scheduleId'>;

export enum LinearPageType {
  linearEpgPage = 'linearEpgPage',
  linearLandingPage = 'linearLandingPage',
}
