import { CheckmarkStroke } from '@tubitv/icons';
import type { FC } from 'react';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import Footer from 'web/components/Footer/Footer';

import styles from './Landing.scss';
import messages from './messages';

const Landing: FC = () => {
  const { formatMessage } = useIntl();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  return (
    <div className={styles.content} data-test-id="email-opt-in">
      <TopPlaceholder logo invert login={!isLoggedIn} register={!isLoggedIn} />
      <div className={styles.wrapper}>
        <div className={styles.circle}>
          <CheckmarkStroke />
        </div>
        <div className={styles.main}>
          <div className={styles.body}>
            <h1 className={styles.title}>{formatMessage(messages.title)}</h1>
            <div className={styles.subtitle}>{formatMessage(messages.subtitle)}</div>
          </div>
          <div>
            <Link to={WEB_ROUTES.home} className={styles.homeLink}>{formatMessage(messages.homeLink)}</Link>
          </div>
          <div className={styles.helpText}>
            {formatMessage(messages.helpText, {
              helpCenter: (text: React.ReactNode[]) => (
                <Link className={styles.link} to={WEB_ROUTES.helpCenter}>{text}</Link>
              ),
            })}
          </div>
        </div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default Landing;
