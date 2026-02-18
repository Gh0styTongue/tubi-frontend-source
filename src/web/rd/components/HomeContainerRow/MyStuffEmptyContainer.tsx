import { MyListOutline, Play } from '@tubitv/icons';
import { IconBorder } from '@tubitv/ott-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import { HISTORY_CONTAINER_ID, QUEUE_CONTAINER_ID } from 'common/constants/constants';

import styles from './MyStuffEmptyContainer.scss';

const messages = defineMessages({
  cwTitle: {
    description: 'my stuff CW row title',
    defaultMessage: 'Continue Watching',
  },
  cwSubtitle: {
    description: 'my stuff CW row subtitle',
    defaultMessage: 'Movies and series you haven\'t finished will show up here.',
  },
  myListTitle: {
    description: 'my stuff My List row title',
    defaultMessage: 'My List',
  },
  myListSubtitle: {
    description: 'my stuff My List row subtitle',
    defaultMessage: 'Use the bookmark button to save favorite series and movies. They\'ll show up here.',
  },
});

const CWIcon = <IconBorder key="cw" className={classNames(styles.icon)}>
  <Play />
</IconBorder>;
const MyListIcon = <IconBorder key="my-list" className={classNames(styles.icon)}>
  <MyListOutline />
</IconBorder>;

type MetaData = {
  icons: JSX.Element[];
  title: MessageDescriptor;
  subtitle: MessageDescriptor;
};

const emptyMetaDataMap: Record<string, MetaData> = {
  [HISTORY_CONTAINER_ID]: {
    icons: [CWIcon],
    title: messages.cwTitle,
    subtitle: messages.cwSubtitle,
  },
  [QUEUE_CONTAINER_ID]: {
    icons: [MyListIcon],
    title: messages.myListTitle,
    subtitle: messages.myListSubtitle,
  },
};

interface Props {
  containerId: string;
}

const MyStuffEmptyRow: FC<Props> = ({
  containerId,
}) => {
  const { formatMessage } = useIntl();
  const metaData: MetaData = emptyMetaDataMap[containerId];

  if (!metaData) return null;

  return (
    <div className={styles.myStuffEmptyContainer} data-test-id="my-stuff-empty-container">
      {metaData.icons}
      <div className={styles.content}>
        <div className={styles.title}>{formatMessage(metaData.title)}</div>
        <div className={styles.subtitle}>{formatMessage(metaData.subtitle)}</div>
      </div>
    </div>
  );
};

export default MyStuffEmptyRow;
