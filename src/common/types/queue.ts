import type {
  ADD_TO_QUEUE,
  ADD_TO_QUEUE_FAIL,
  ADD_TO_QUEUE_SUCCESS,
  LOAD_QUEUE_FAIL,
  LOAD_QUEUE_SUCCESS,
  REMOVE_FROM_QUEUE_FAIL,
  REMOVE_FROM_QUEUE_SUCCESS,
  UNLOAD_QUEUE,
} from 'common/constants/action-types';

export type ContentType = 'movie' | 'series' | 'sports_event';

interface QueueContent {
  id: string;
  contentType: ContentType;
  dateAddedInMs?: number;
}

export interface ContentIdMap {
  [key: string]: QueueContent;
}

export interface Error {
  status: number;
  message: string;
}

// The following is a starting point, created quickly
// from the initial state for the reducer. As we start
// to use these, we should flesh out the definitions,
// especially for things like {}, unknown, making
// properties optional where necessary, and
// adding "| null" if nullable.
export interface QueueState {
  loaded: boolean;
  loading: boolean;
  inProgress: Record<string, boolean>;
  contentIdMap: ContentIdMap;
}

// https://github.com/adRise/api_docs/blob/main/lex/user_queue.v1.yaml
export interface QueueItem {
  id: string;
  content_id: string;
  content_type: ContentType;
  updated_at?: string;
}

export enum QueueItemType {
  REMIND_ME = 'remind_me',
  WATCH_LATER = 'watch_later',
}

export interface QueueData {
  dataMap: ContentIdMap;
}

export type QueueAction = AddToQueueAction |
  AddToQueueFailAction |
  AddToQueueSuccessAction |
  DefaultEmptyAction |
  LoadQueueFailAction |
  LoadQueueSuccessAction |
  RemoveFromQueueFailAction |
  RemoveFromQueueSuccessAction |
  UnloadQueueAction;

export interface AddToQueueAction {
  type: typeof ADD_TO_QUEUE;
  contentId: string;
}

export interface AddToQueueFailAction {
  type: typeof ADD_TO_QUEUE_FAIL;
  contentId: string;
  error: Error;
}

export interface AddToQueueSuccessAction {
  type: typeof ADD_TO_QUEUE_SUCCESS;
  contentId: string;
  contentType: ContentType;
  result: QueueItem;
}

interface DefaultEmptyAction {
  type: '';
}

export interface LoadQueueFailAction {
  type: typeof LOAD_QUEUE_FAIL;
  error: Error;
}

export interface LoadQueueSuccessAction {
  type: typeof LOAD_QUEUE_SUCCESS;
  idMap: ContentIdMap;
}

export interface RemoveFromQueueFailAction {
  type: typeof REMOVE_FROM_QUEUE_FAIL;
  contentId: string;
  error: Error;
}

export interface RemoveFromQueueSuccessAction {
  type: typeof REMOVE_FROM_QUEUE_SUCCESS;
  contentId: string;
}

export interface UnloadQueueAction {
  type: typeof UNLOAD_QUEUE;
}
