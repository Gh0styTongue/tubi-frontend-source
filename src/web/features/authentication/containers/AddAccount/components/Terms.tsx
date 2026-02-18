import { ATag } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';

import styles from './Terms.scss';

const messages = defineMessages({
  terms: {
    description: 'terms text',
    defaultMessage: 'By clicking a button below, you agree to Tubi’s <termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>.',
  },
});

const Terms = () => {
  const intl = useIntl();
  return (
    <p className={styles.terms}>{intl.formatMessage(messages.terms, {
      termsLink: ([msg]: React.ReactNode[]) => <ATag to={WEB_ROUTES.terms} target="_blank">{msg}</ATag>,
      privacyLink: ([msg]: React.ReactNode[]) => <ATag to={WEB_ROUTES.privacy} target="_blank">{msg}</ATag>,
    })}</p>
  );
};

export default Terms;
