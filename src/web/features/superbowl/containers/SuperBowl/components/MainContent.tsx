/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { Subtitles } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import styles from '../SuperBowl.scss';
import messages from '../superBowlMessages';

interface MainContentProps {
  isHowToWatchPage?: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isHowToWatchPage = false }) => {
  const intl = useIntl();

  return (
    <div className={styles.mainContent}>
      <div className={classNames(styles.logo, { [styles.smallLogo]: isHowToWatchPage })} />
      {!isHowToWatchPage ?
        <div className={styles.tubiLogo} />
        : null
      }
      {isHowToWatchPage ? (
        <>
          <h1 className={styles.title}>{intl.formatMessage(messages.howToWatchPageTitle)}</h1>
          <p className={styles.description}>{intl.formatMessage(messages.howToWatchPageDescription1)}</p>
          <p className={styles.description}>{intl.formatMessage(messages.howToWatchPageDescription2)}</p>
        </>
      ) : (
        <>
          <h4 className={styles.attributes}>
            {intl.formatMessage(messages.gameTag)}
            <Subtitles className={styles.tagIcon} />
          </h4>
          <p className={styles.description}>{intl.formatMessage(messages.gameDescription1)}</p>
          <p className={styles.description}>{intl.formatMessage(messages.gameDescription2)}</p>
          <p className={styles.note}>{intl.formatMessage(messages.gameDescription3)}</p>
        </>
      )}
    </div>
  );
};

export default MainContent;
