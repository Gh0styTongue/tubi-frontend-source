import { Alert } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import type { StatusKeys, StatusValues } from 'common/constants/magic-link';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import Footer from 'web/components/Footer/Footer';

import styles from './WebMagicLink.scss';

const allMessages = defineMessages({
  failTitle: {
    description: 'title for failed state',
    defaultMessage: 'Your link has expired.',
  },
  errorTitle: {
    description: 'title for error state',
    defaultMessage: 'Hmm... that didn\'t<linebreak></linebreak>quite work.',
  },
  errorDesc: {
    description: 'desc for failed state',
    defaultMessage: 'Click the link we sent again or return<linebreak></linebreak>to the sign-in screen to try again.',
  },
  button: {
    description: 'button text',
    defaultMessage: 'Back to Sign In',
  },
  tips: {
    description: 'tips text',
    defaultMessage: 'Need Help? <helpCenter>Visit Help Center</helpCenter>',
  },
});

const getMessagesByStatus = (status: StatusKeys) => {
  return {
    title: allMessages[`${status}Title`],
    desc: allMessages[`${status}Desc`],
  };
};

const WebMagicLink = ({ status }: { status: StatusValues }) => {
  const messages = getMessagesByStatus(status as StatusKeys);
  const { formatMessage } = useIntl();

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.iconWrapper}>
          <Alert />
        </div>
        <div className={styles.title}>{formatMessage(messages.title, { linebreak: () => <br /> })}</div>
        {messages.desc && (
          <div className={styles.desc}>{formatMessage(messages.desc, { linebreak: () => <br /> })}</div>
        )}
        <Button
          className={styles.button}
          appearance="primary"
          width="theme"
          onClick={() => tubiHistory.replace(WEB_ROUTES.signIn)}
        >
          {formatMessage(allMessages.button)}
        </Button>
        <div className={styles.tips}>
          {formatMessage(allMessages.tips, {
            helpCenter: (text: React.ReactNode[]) => (
              <Link className={styles.link} to={WEB_ROUTES.helpCenter}>
                {text}
              </Link>
            ),
          })}
        </div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default WebMagicLink;
