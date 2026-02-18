import type { ThunkDispatch } from 'redux-thunk';

import type ApiClient from 'common/helpers/ApiClient';
import type StoreState from 'common/types/storeState';

export interface StoreLike {
  dispatch: ThunkDispatch<StoreState, ApiClient, any>; // Using `any` here saddens me, but I cannot figure out a better way atm. -Greg
  getState(): StoreState;
  subscribe(callback: VoidFunction): VoidFunction;
}

export interface VisibleEpisodes {
  seasonNumber: number;
  episodeStartIndex: number;
  episodeEndIndexInclusive: number;
}

export enum FetchStatus {
  Success = 0,
  Error = 1,
  Timeout = 2,
  Cancelled = 3,
}

export interface PromiseResponse<InFlightResponse> {
  status: FetchStatus;
  response?: InFlightResponse;
}
