import { CheckmarkCircleStroke } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';

import messages from './successMessages';
import styles from '../Activation.scss';
import ContentWrapper from '../ContentWrapper/ContentWrapper';

interface Props {
  newDesign?: boolean;
}
const Success: React.FC<Props> = ({ newDesign }) => {
  const { formatMessage } = useIntl();
  return (
    <ContentWrapper
      header={formatMessage(messages.title)}
      iconComponent={CheckmarkCircleStroke}
      subheader={formatMessage(newDesign ? messages.subtitle2 : messages.subtitle)}
      newDesign={newDesign}
    >
      <Link to={WEB_ROUTES.home} className={styles.buttonLink}>
        {formatMessage(newDesign ? messages.link2 : messages.link)}
      </Link>
    </ContentWrapper>
  );
};

export default Success;
