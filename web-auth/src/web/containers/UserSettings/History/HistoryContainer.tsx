import type { Location } from 'history';
import React, { PureComponent } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl, defineMessages } from 'react-intl';
import { connect } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { loadContainer } from 'common/actions/container';
import { remove as removeFromHistory } from 'common/actions/history';
import { remove as removeFromQueue } from 'common/actions/queue';
import { QUEUE_CONTAINER_ID, HISTORY_CONTAINER_ID } from 'common/constants/constants';
import logger from 'common/helpers/logging';
import { containerSelector, containerLoadIdMapSelector } from 'common/selectors/container';
import { isMajorEventFailsafeActiveSelector, majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import type { FetchDataParams } from 'common/types/container';
import type { QueueState } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type WebStoreState from 'common/types/storeState';
import DeepLinkActionPrompt from 'web/features/deepLinkActions/components/DeepLinkActionPrompt/DeepLinkActionPrompt';
import { isDeepLinkAction } from 'web/features/deepLinkActions/utils';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';

import History from './History';

export const messages = defineMessages({
  watchTab: {
    description: 'user settings history page tab title with normal case',
    defaultMessage: 'Continue Watching',
  },
  queueTab: {
    description: 'user settings history page tab title with normal case',
    defaultMessage: 'My List',
  },
});

export interface Props {
  intl: IntlShape;
  dispatch: TubiThunkDispatch;
  historyIdList: string[];
  queueIdList: string[];
  queue: QueueState;
  location: Location;
  currentDate: Date;
  isMajorEventFailsafe: boolean;
  majorEventFailsafeMessages: ReturnType<typeof majorEventFailsafeMessageSelector>;
}

export class HistoryContainer extends PureComponent<Props> {
  static fetchData = fetchData;

  TABS = [
    this.props.intl.formatMessage(messages.watchTab),
    this.props.intl.formatMessage(messages.queueTab),
  ];

  deleteFromQueue = (contentId: string) => {
    const { dispatch, intl, isMajorEventFailsafe, currentDate, majorEventFailsafeMessages } = this.props;
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'myList',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }

    const { contentIdMap } = this.props.queue;
    const itemId = contentIdMap[contentId].id;
    this.props.dispatch(removeFromQueue(itemId, contentId, this.props.location));
  };

  deleteFromHistory = (contentId: string) => {
    const { dispatch, intl, isMajorEventFailsafe, currentDate, majorEventFailsafeMessages } = this.props;
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature: 'continueWatching',
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }
    this.props.dispatch(removeFromHistory(this.props.location, contentId));
  };

  deleteAll = (tabIndex: number) => {
    const { queueIdList, historyIdList, isMajorEventFailsafe, dispatch, intl, currentDate, majorEventFailsafeMessages } = this.props;
    const feature = tabIndex === 1 ? 'myList' : 'continueWatching';
    if (isMajorEventFailsafe) {
      showFeatureUnavailableToaster({
        dispatch,
        intl,
        feature,
        currentDate,
        majorEventFailsafeMessages,
      });
      return;
    }

    // todo need better solution for this, batch remove route?
    // queue
    if (tabIndex === 1 && queueIdList.length) {
      queueIdList.forEach((id) => {
        this.deleteFromQueue(id);
      });
    }

    // history
    if (tabIndex === 0 && historyIdList.length) {
      historyIdList.forEach((id) => {
        this.deleteFromHistory(id);
      });
    }
  };

  render() {
    const { historyIdList, location, queueIdList } = this.props;
    return (
      <>
        <History
          tabs={this.TABS}
          deleteFromQueue={this.deleteFromQueue}
          deleteFromHistory={this.deleteFromHistory}
          deleteAll={this.deleteAll}
          historyIdList={historyIdList}
          queueIdList={queueIdList}
        />
        {isDeepLinkAction(location) ? <DeepLinkActionPrompt location={location} /> : null}
      </>
    );
  }
}

// interface FetchData {
//   getState: () => WebStoreState;
//   dispatch: TubiThunkDispatch;
// }

/**
 * ensure queue and history containers are loaded
 */
export function fetchData({ getState, dispatch, location }: FetchDataParams<Record<string, unknown>>) {
  const promises = [];
  const containerLoadIdMap = containerLoadIdMapSelector(getState(), { pathname: location.pathname });

  const queueLoadStatus = containerLoadIdMap[QUEUE_CONTAINER_ID] || {};
  const queueContainerLoaded = queueLoadStatus.loaded && queueLoadStatus.cursor === null;
  const historyLoadStatus = containerLoadIdMap[HISTORY_CONTAINER_ID] || {};
  const historyCatLoaded = historyLoadStatus.loaded && historyLoadStatus.cursor === null;

  // @note - include very high 'limit' for loadContainer, we need all contents for queue and history
  if (!historyCatLoaded) {
    promises.push(dispatch(loadContainer({ location, id: HISTORY_CONTAINER_ID, expand: 1, limit: 500 })));
  }
  if (!queueContainerLoaded) {
    promises.push(dispatch(loadContainer({ location, id: QUEUE_CONTAINER_ID, expand: 1, limit: 500 })));
  }
  return Promise.all(promises)
    .catch((err) => {
      logger.info(err, 'Error while fetching data - History');
      return Promise.reject(err);
    });
}

export const mapStateToProps = (state: WebStoreState, { location }: WithRouterProps) => {
  const { queue } = state;
  const { containerChildrenIdMap: { continue_watching: historyIdList = [], queue: queueIdList = [] } } = containerSelector(state, { pathname: location.pathname });
  return {
    queue,
    historyIdList,
    queueIdList,
    currentDate: state.ui.currentDate,
    isMajorEventFailsafe: isMajorEventFailsafeActiveSelector(state),
    majorEventFailsafeMessages: majorEventFailsafeMessageSelector(state),
  };
};

const connectedHistory = withRouter(connect(mapStateToProps)(injectIntl(HistoryContainer)));
export default connectedHistory;
