import { Alert } from '@tubitv/icons';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { RouteComponentProps } from 'react-router';
import { Link } from 'react-router';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import Footer from 'web/components/Footer/Footer';

import styles from './RegistrationLink.scss';

const messages = defineMessages({
  failedTitle: {
    description: 'title for failed state',
    defaultMessage: 'Hmm... that didn\'t<linebreak></linebreak>quite work.',
  },
  expiredTitle: {
    description: 'title for expired state',
    defaultMessage: 'Link Expired',
  },
  failedDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Click the link we sent again or return to the sign-in screen to try again. Need help? Let us know at <helpCenter>tubitv.com/support</helpCenter>',
  },
  expiredDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Try signing into your TV again to generate a new verification link. Need help? Let us know at <helpCenter>tubitv.com/support</helpCenter>',
  },
});

export type RegistrationLinkStatus = 'expired' | 'failed';

const RegistrationLink = ({ routeParams }: RouteComponentProps<unknown, { status: RegistrationLinkStatus }>) => {
  const { status } = routeParams;
  const { formatMessage } = useIntl();

  const linebreak = () => <br />;
  const helpCenter = (text: React.ReactNode[]) => (
    <Link className={styles.link} to={WEB_ROUTES.helpCenter}>
      {text}
    </Link>
  );
  return (
    <div className={styles.root}>
      <TopPlaceholder logo invert />
      <div className={styles.wrapper}>
        <div className={styles.iconWrapper}>
          <Alert />
        </div>
        <div className={styles.title}>{formatMessage(status === 'failed' ? messages.failedTitle : messages.expiredTitle, { linebreak })}</div>
        <div className={styles.desc}>{formatMessage(status === 'failed' ? messages.failedDesc : messages.expiredDesc, { helpCenter })}</div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default RegistrationLink;
