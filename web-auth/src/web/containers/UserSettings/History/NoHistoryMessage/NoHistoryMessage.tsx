import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from './NoHistoryMessage.scss';
import sharedStyles from '../../UserSettings.scss';

export const messages = defineMessages({
  header: {
    description: 'header text for history page when user has no history',
    defaultMessage: 'Oops! Nothing yet here!',
  },
  subheader: {
    description: 'subheader text for history page when user has no history',
    defaultMessage: 'Movies and TV shows you haven\'t finished watching or have added to your list will appear here.',
  },
  buttonText: {
    description: 'button text for history page when user has no history',
    defaultMessage: 'Go Back Home',
  },
});

const NoHistoryMessage: React.FC = () => {
  const { formatMessage } = useIntl();
  return (
    <div className={classNames(sharedStyles.main, styles.noHistoryMessage)}>
      <h1 className={classNames(sharedStyles.header, styles.header)}>{formatMessage(messages.header)}</h1>
      <p className={classNames(sharedStyles.subheader, styles.subheader)}>{formatMessage(messages.subheader)}</p>
      <Link to={WEB_ROUTES.home} className={styles.buttonLink}>
        {formatMessage(messages.buttonText)}
      </Link>
    </div>
  );
};

export default NoHistoryMessage;
