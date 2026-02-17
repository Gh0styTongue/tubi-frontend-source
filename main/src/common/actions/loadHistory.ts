import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { makeLoadHistoryRequest } from 'common/api/history';
import type { LoadHistoryRequestData } from 'common/api/history';
import * as actions from 'common/constants/action-types';
import logger from 'common/helpers/logging';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { formatSeriesIdInHistory } from 'common/utils/history';
import { formatError } from 'common/utils/log';
import { getPlatform } from 'common/utils/platform';

import type ApiClient from '../helpers/ApiClient';

const platform = getPlatform();

/**
 * get dataMap from /oz/history and update history store
 */
export function loadHistory(forceUpdate?: boolean): ThunkAction<Promise<void>, StoreState, ApiClient, AnyAction> {
  return async (dispatch, getState) => {
    const { history, auth } = getState();

    // resolve immediately if history is "loading" or "loaded but not force updated"
    if (history.loading || (history.loaded && !forceUpdate)) {
      return;
    }

    try {
      const qsData: LoadHistoryRequestData = {
        page_enabled: false,
        expand: false,
        platform,
        deviceId: auth.deviceId,
      };
      const response = await makeLoadHistoryRequest(dispatch, qsData);
      /* istanbul ignore else */
      if (response) {
        const { dataMap } = formatSeriesIdInHistory(response);
        // place idMap in history store
        dispatch(actionWrapper(actions.LOAD_HISTORY_SUCCESS, { idMap: dataMap }));
      }
    } catch (error) {
      logger.error(formatError(error), 'ERROR - /api/v2/view_history view');
      dispatch(actionWrapper(actions.LOAD_HISTORY_FAIL, { error }));
      throw error;
    }
  };
}

