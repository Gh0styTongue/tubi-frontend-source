import * as actions from 'common/constants/action-types';
import { BANNER_CONTAINER_ID, PURPLE_CARPET_CONTAINER_ID } from 'common/constants/constants';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { platform } from 'src/config';

import { getPurpleCarpetContentStatus, getPurpleCarpetStatusFromMainGame } from './util';

const LISTING_URL = 'https://prod.api.haw.digitalvideoplatform.com/v3.0/listings';

export const loadListing: (force?: boolean) => TubiThunkAction<{
  type: typeof actions.LOAD_PURPLE_CARPET_LISTING,
  payload: () => Promise<unknown>,
}> = (force = false) => (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
  const { container: { containerIdMap } } = getState();
  if (!containerIdMap[PURPLE_CARPET_CONTAINER_ID] && !force) {
    return Promise.resolve();
  }

  return dispatch({
    type: actions.LOAD_PURPLE_CARPET_LISTING,
    payload: (): Promise<unknown> =>
      client.get(LISTING_URL, { headers: { 'X-Api-Key': `tubi_${platform}` } }),
  });
};

export const updatePurpleCarpetStatus: () => TubiThunkAction = () => (dispatch: TubiThunkDispatch, getState: () => StoreState, _) => {
  const {
    ui: { currentDate },
    purpleCarpet: { listing, status },
    container: { containerChildrenIdMap },
  } = getState();
  if (!containerChildrenIdMap[BANNER_CONTAINER_ID] && !containerChildrenIdMap[PURPLE_CARPET_CONTAINER_ID]) {
    return;
  }

  let newStatus = status;
  if (containerChildrenIdMap[BANNER_CONTAINER_ID]) {
    newStatus = getPurpleCarpetStatusFromMainGame({ hasContents: true, hasBanner: true });
  } else if (containerChildrenIdMap[PURPLE_CARPET_CONTAINER_ID].length) {
    const mainGameId = containerChildrenIdMap[PURPLE_CARPET_CONTAINER_ID][0];
    const mainGameStatus = getPurpleCarpetContentStatus({ listing, id: mainGameId, currentDate });
    newStatus = getPurpleCarpetStatusFromMainGame({ hasContents: true, hasBanner: false, mainGameStatus });
  }
  if (newStatus !== status) {
    dispatch(actionWrapper(actions.SET_PURPLE_CARPET_STATUS, { status: newStatus }));
  }
};
