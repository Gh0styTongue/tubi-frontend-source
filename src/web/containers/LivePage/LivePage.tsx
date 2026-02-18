import React from 'react';
import { useSelector } from 'react-redux';

import { loadLiveNewsContainers } from 'common/actions/container';
import { loadEPGContentIds } from 'common/actions/epg';
import { LIVE_CONTENT_MODES } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import { isWebEpgEnabledSelector } from 'common/selectors/epg';
import type { FetchDataParams } from 'common/types/container';
import { getLogLevel } from 'common/utils/log';
import EPG from 'web/containers/EPG/EPG';
import Live from 'web/containers/Live/Live';

const LivePage = () => {
  const isEPGEnabled = useSelector(isWebEpgEnabledSelector);

  return isEPGEnabled ? <EPG /> : <Live />;
};

export function fetchData({ dispatch, getState, location }: FetchDataParams<Record<string, unknown>>) {
  const state = getState();
  try {
    if (isWebEpgEnabledSelector(state)) {
      return dispatch(loadEPGContentIds(LIVE_CONTENT_MODES.all));
    }
    return dispatch(loadLiveNewsContainers({ location }));
  } catch (err) {
    const loggerType = getLogLevel(err.errType);
    logger[loggerType]({ error: err }, 'error when loading data for the All live news channel');
    return Promise.reject(err);
  }
}

LivePage.fetchData = fetchData;
LivePage.fetchDataDeferred = fetchData;

export default LivePage;
