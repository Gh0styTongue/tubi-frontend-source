// The following is a starting point, created quickly
// from the initial state for the reducer. As we start
// to use these, we should flesh out the definitions,
// especially for things like {}, unknown, making
// properties optional where necessary, and
// adding "| null" if nullable.

import type { VideoContentResponse, VideoContentSeason, VideoContentVideo } from 'client/utils/clientDataRequest';
import type {
  ADD_TO_HISTORY,
  ADD_TO_HISTORY_FAIL,
  ADD_TO_HISTORY_SUCCESS,
  ITEM_REMOVED_ON_SEPARATE_DEVICE,
  LOAD_HISTORY_BY_ID_SUCCESS,
  LOAD_HISTORY_FAIL,
  LOAD_HISTORY_SUCCESS,
  REMOVE_FROM_HISTORY,
  REMOVE_FROM_HISTORY_FAIL,
  REMOVE_FROM_HISTORY_SUCCESS,
  UNLOAD_HISTORY,
} from 'common/constants/action-types';

export interface HistoryResponseBody {
  total_count: number;
  more: boolean;
  items: HistoryResponseItem[];
}

export interface HistoryResponseItem {
  id: string;
  user_id: number;
  content_id: number;
  content_type: string;
  content_length?: number;
  state: string;
  position: number;
  created_at: string;
  updated_at: string;
  episodes?: HistoryResponseEpisode[];
  content?: VideoContentResponse;
}

interface HistoryResponseEpisode {
  id: string;
  user_id: number;
  content_id: number;
  content_type: string;
  content_length: number;
  state: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type MovieHistory = {
  contentId: number;
  contentLength: number;
  contentType: 'movie';
  createdAt: string;
  id: string;
  position: number;
  state: HistoryWatchedState;
  updatedAt: string;
  userId: number;
};

export enum HistoryWatchedState {
  open = 'open', // content has not been watched
  middle = 'middle', // content has been watched but not finished
  finished = 'finished', // content has been finished
}

export type SeriesHistory = {
  contentId: number;
  contentType: 'series';
  createdAt: string;
  id: string;
  episodes: HistoryEpisode[];
  position: number;
  state: HistoryWatchedState;
  updatedAt: string;
  userId: number;
};

export type History = MovieHistory | SeriesHistory;

export interface HistoryState {
  loaded: boolean;
  loading: boolean;
  inProgress: Record<string, unknown>;
  contentIdMap: Record<string, History | boolean | string | undefined | null>;
  err?: Error;
}

export interface HistoryEpisode {
  contentId: number;
  contentLength: number;
  id: string;
  position: number;
  state: HistoryWatchedState;
  userId: number;
}

export interface SamsungCWLocalHistoryItem {
  contentId: string;
  contentLength: number;
  contentType: string;
  createdAt: string;
  id: string;
  position: number;
  seriesId?: string;
  state?: HistoryWatchedState;
  updatedAt: string;
  userId: number;
}

interface BaseHistoryAction {
  contentId: string;
  result: string
}

interface BaseHistoryErrorAction {
  error: Error;
}

export interface LoadHistorySuccessAction extends BaseHistoryAction {
  type: typeof LOAD_HISTORY_SUCCESS;
  idMap: Record<string, History>;
}

export interface LoadHistoryFailAction extends BaseHistoryAction, BaseHistoryErrorAction {
  type: typeof LOAD_HISTORY_FAIL;
}

export interface LoadHistoryByIdSuccessAction extends BaseHistoryAction {
  type: typeof LOAD_HISTORY_BY_ID_SUCCESS;
  idMap: Record<string, History>;
}

export interface AddToHistoryFailAction extends BaseHistoryAction, BaseHistoryErrorAction {
  type: typeof ADD_TO_HISTORY_FAIL;
}
export interface RemoveFromHistoryFailAction extends BaseHistoryAction, BaseHistoryErrorAction {
  type: typeof REMOVE_FROM_HISTORY_FAIL;
}

export interface SimpleHistoryAction extends BaseHistoryAction {
  type: typeof ADD_TO_HISTORY |
    typeof ADD_TO_HISTORY_SUCCESS |
    typeof REMOVE_FROM_HISTORY |
    typeof REMOVE_FROM_HISTORY_SUCCESS |
    typeof ITEM_REMOVED_ON_SEPARATE_DEVICE |
    typeof UNLOAD_HISTORY |
    '';
}

export type HistoryAction = SimpleHistoryAction |
  LoadHistoryFailAction |
  LoadHistorySuccessAction |
  LoadHistoryByIdSuccessAction |
  AddToHistoryFailAction |
  RemoveFromHistoryFailAction;

export interface HistoryResponseBodyContent extends HistoryResponseBody {
  items: HistoryResponseItemContent[];
}
interface HistoryResponseItemContent extends HistoryResponseItem {
  content: VideoContentResponseContent
}

interface VideoContentResponseContent extends VideoContentResponse {
  children: VideoContentSeasonContent[];
}

interface VideoContentSeasonContent extends VideoContentSeason {
  children: VideoContentVideo[];
}

export interface AddToHistoryStartPayload {
    contentId: string;
    contentType: string;
    position: number;
    episodes?: { contentId: string, position: number }[] | null;
  }

export interface AddToHistorySuccessPayload extends AddToHistoryStartPayload {
    contentLength: number;
    contentType: 'movie'
    createdAt: string;
    episodeIds: string[] | null;
    id: string;
    state: string;
    updatedAt: string;
    userId: number;
  }
