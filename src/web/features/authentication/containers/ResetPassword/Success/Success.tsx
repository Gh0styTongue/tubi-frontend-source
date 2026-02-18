import { CheckmarkCircleStroke } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';

import messages from './successMessages';
import ContentWrapper from '../ContentWrapper/ContentWrapper';
import styles from '../ResetPassword.scss';

const Success = () => {
  const { formatMessage } = useIntl();
  return (
    <ContentWrapper
      header={formatMessage(messages.title)}
      iconComponent={CheckmarkCircleStroke}
      subheader={formatMessage(messages.subtitle)}
    >
      <a href={`https://tubitv.com${WEB_ROUTES.signIn}`} className={styles.buttonLink}>
        {formatMessage(messages.link)}
      </a>
    </ContentWrapper>
  );
};

export default Success;
