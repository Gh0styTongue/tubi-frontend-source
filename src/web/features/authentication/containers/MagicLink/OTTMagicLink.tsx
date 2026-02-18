import { Alert, CheckmarkCircleStroke } from '@tubitv/icons';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import type { StatusKeys, StatusValues } from 'common/constants/magic-link';
import { WEB_ROUTES } from 'common/constants/routes';
import Footer from 'web/components/Footer/Footer';

import styles from './MagicLink.scss';

export const allMessages = defineMessages({
  successTitle: {
    description: 'title for success state',
    defaultMessage: 'Verification successful',
  },
  successDesc: {
    description: 'description for success state',
    defaultMessage: 'Your TV screen will refresh in a few seconds.<linebreak></linebreak>Need help? Let us know at <supportLink></supportLink>',
  },
  failTitle: {
    description: 'title for failed state',
    defaultMessage: 'Link expired',
  },
  failDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Try signing into your TV again to generate a new verification link.<linebreak></linebreak>Need help? Let us know at <supportLink></supportLink>',
  },
  errorTitle: {
    description: 'title for error state',
    defaultMessage: 'Something went wrong',
  },
  errorDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Try clicking on the verification link again.<linebreak></linebreak>Need help? Let us know at <supportLink></supportLink>',
  },
});

const getMessagesByStatus = (status: StatusKeys) => {
  return {
    title: allMessages[`${status}Title`],
    desc: allMessages[`${status}Desc`],
  };
};

const OTTMagicLink = ({ status }: { status: StatusValues }) => {
  const messages = getMessagesByStatus(status as StatusKeys);
  const { formatMessage } = useIntl();

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.iconWrapper}>
          {status === 'success' ? <CheckmarkCircleStroke /> : <Alert />}
        </div>
        <div className={styles.title}>{formatMessage(messages.title)}</div>
        <div className={styles.desc}>{formatMessage(messages.desc, {
          linebreak: () => <br />,
          // eslint-disable-next-line react/jsx-no-literals
          supportLink: () => <Link className={styles.supportLink} to={WEB_ROUTES.supportRedirect}>tubitv.com/support</Link>,
        })}</div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default OTTMagicLink;
