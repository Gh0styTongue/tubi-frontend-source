import { Button } from '@tubitv/web-ui';
import type { ErrorInfo, FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import StackTrace from 'common/components/StackTrace/StackTrace';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { WEB_ROUTES } from 'common/constants/routes';
import ThemeProvider from 'common/features/theme/ThemeProvider';

import styles from './FatalErrorMessage.scss';

const messages = {
  // the object keys are mapped to the template variables found in the error page templates in /static/errorPageTemplates
  ...defineMessages({
    ohSnap: {
      description: 'fatal error page heading',
      defaultMessage: 'Oh Snap!',
    },
    somethingWentWrong: {
      description: 'fatal error page description',
      defaultMessage: 'Looks like something went wrong.',
    },
    backHome: {
      description: 'back home link',
      defaultMessage: 'Back Home',
    },
  }),
};

const FatalErrorMessage: FC<{error: Error, errorInfo?: ErrorInfo}> = ({ error, errorInfo }) => {
  const intl = useIntl();

  return (
    <ThemeProvider>
      <div className={styles.container}>
        <div className={styles.header}>
          <a href={WEB_ROUTES.home} className={styles.logoLink} aria-label="Tubi Home">
            <Tubi className={styles.logo} />
          </a>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{intl.formatMessage(messages.ohSnap)}</h2>
          <div className={styles.message}>
            <div>{intl.formatMessage(messages.somethingWentWrong)}</div>
            <StackTrace error={error} errorInfo={errorInfo} />
          </div>
          <div>
            <a href={WEB_ROUTES.home}>
              <Button appearance="primary">{intl.formatMessage(messages.backHome)}</Button>
            </a>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default FatalErrorMessage;
