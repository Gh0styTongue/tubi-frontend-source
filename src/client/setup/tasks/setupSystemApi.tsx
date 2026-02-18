import systemApi from 'client/systemApi';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';

export const setupSystemApi = (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
  systemApi.init(dispatch, getState);
  return systemApi;
};
