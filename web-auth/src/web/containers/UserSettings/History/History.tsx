import { Button } from '@tubitv/web-ui';
import React, { useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import styles from './History.scss';
import HistoryQueueTable from './HistoryQueueTable/HistoryQueueTable';
import NoHistoryMessage from './NoHistoryMessage/NoHistoryMessage';
import Tabs from './Tabs/Tabs';
import sharedStyles from '../UserSettings.scss';

const messages = defineMessages({
  deleteWatch: {
    description: 'Delete All From Continue Watching button text',
    defaultMessage: 'Delete All From Continue Watching',
  },
  deleteQueue: {
    description: 'Delete queue button text',
    defaultMessage: 'Delete My List',
  },
  title: {
    description: 'Continue Watching & My List settings page title',
    defaultMessage: 'Continue Watching & My List',
  },
  description: {
    description: 'Continue Watching & My List settings page ',
    defaultMessage: 'Manage your Continue Watching and List',
  },
  remove: {
    description: 'Remove button text of each row',
    defaultMessage: 'Remove',
  },
  delete: {
    description: 'Delete button text of each row',
    defaultMessage: 'Delete',
  },
});

interface HistoryProps {
  deleteAll: (index: number) => void;
  deleteFromHistory: (contentId: string) => void;
  deleteFromQueue: (contentId: string) => void;
  historyIdList: string[];
  queueIdList: string[];
  tabs: string[];
}

const History: React.FC<HistoryProps> = ({
  deleteAll,
  deleteFromHistory,
  deleteFromQueue,
  historyIdList,
  queueIdList,
  tabs,
}) => {
  const { formatMessage } = useIntl();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleHeaderClick = (index: number) => {
    if (activeTabIndex !== index) {
      setActiveTabIndex(index);
    }
  };

  const handleDeleteAll = () => {
    deleteAll(activeTabIndex);
  };

  const { items, btnText, rowBtnText, handler, tabHeader } = useMemo(() => {
    const tabMetas = [
      {
        tabHeader: tabs[0],
        btnText: formatMessage(messages.deleteWatch),
        rowBtnText: formatMessage(messages.delete),
        handler: deleteFromHistory,
        items: historyIdList,
      },
      {
        tabHeader: tabs[1],
        btnText: formatMessage(messages.deleteQueue),
        rowBtnText: formatMessage(messages.remove),
        handler: deleteFromQueue,
        items: queueIdList,
      },
    ];
    return tabMetas[activeTabIndex];
  }, [activeTabIndex, deleteFromHistory, deleteFromQueue, formatMessage, historyIdList, queueIdList, tabs]);

  // display empty state
  if (historyIdList.length === 0 && queueIdList.length === 0) {
    return <NoHistoryMessage />;
  }

  return (
    <div className={sharedStyles.main}>
      <h1 className={sharedStyles.header}><FormattedMessage {...messages.title} /></h1>
      <p className={sharedStyles.subheader}><FormattedMessage {...messages.description} /></p>
      <div className={styles.content}>
        <Tabs activeTabIndex={activeTabIndex} tabMeta={tabs} headerClick={handleHeaderClick}>
          <HistoryQueueTable
            deleteHandler={handler}
            deleteButtonText={rowBtnText}
            contentIds={items}
            key={tabHeader}
          />
        </Tabs>
        {
          btnText && items.length ? (
            <Button
              className={styles.deleteAllButton}
              type="button"
              appearance="primary"
              onClick={handleDeleteAll}
            >{btnText}</Button>
          ) : null }
      </div>
    </div>
  );
};

export default History;
