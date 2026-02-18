/* eslint-disable react/forbid-component-props */
/* istanbul ignore file */
import { Subtitles } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import { MAIN_CONTENT } from 'web/features/purpleCarpet/containers/SuperBowl/sb-constants';

import { SignInToWatchButton, useCountDownTimer } from './ContentCard';
import styles from '../SuperBowl.scss';
import messages from '../superBowlMessages';

interface MainContentProps {
  isHowToWatchPage?: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isHowToWatchPage = false }) => {
  const intl = useIntl();

  // PurpleCarpet should be not PurpleCarpetStatus.NotAvailable, otherwise it will not show the countdown timer
  const { timeStrings, dateString } = useCountDownTimer({ airDatetime: MAIN_CONTENT.airDatetime, id: MAIN_CONTENT.id, shouldIgnorePcStatus: true });

  return (
    <div className={styles.mainContent}>
      {timeStrings?.length || dateString ? (
        <div className={styles.labelRow}>
          {dateString ? <div className={styles.dateLabel}>{dateString}</div> : null}
          {timeStrings.map((time, index) => (
            <div key={index} className={styles.timeLabel}>
              {time}
            </div>
          ))}
        </div>
      ) : null}

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
      <div className={styles.reminderContainer}>
        <SignInToWatchButton linkTo={isHowToWatchPage ? WEB_ROUTES.howToWatchSuperBowl : undefined} content={MAIN_CONTENT} />
      </div>
    </div>
  );
};

export default MainContent;
