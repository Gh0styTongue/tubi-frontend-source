import { Shield } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import messages from './invalidContentMessages';
import ContentWrapper from '../ContentWrapper/ContentWrapper';
import styles from '../ResetPassword.scss';

const InvalidContent = () => {
  const { formatMessage } = useIntl();
  return (
    <ContentWrapper
      header={formatMessage(messages.title)}
      iconComponent={Shield}
      subheader={formatMessage(messages.subtitle)}
    >
      <Link to={WEB_ROUTES.forgotPassword} className={styles.buttonLink}>
        {formatMessage(messages.link)}
      </Link>
    </ContentWrapper>
  );
};

export default InvalidContent;
