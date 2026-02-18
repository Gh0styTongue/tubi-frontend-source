import { CheckmarkCircleStroke } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import type { Kid } from 'common/features/authentication/types/auth';

import SuccessWithKids from './SuccessWithKids';
import activationStyles from '../Activation.scss';
import messages from './successMessages';
import ContentWrapper from '../ContentWrapper/ContentWrapper';

interface Props {
  newDesign?: boolean;
  kids: Kid[];
}

const Success: React.FC<Props> = ({ newDesign, kids }) => {
  const { formatMessage } = useIntl();
  // If there are kids, show the linked kids accounts
  if (kids.length > 0) {
    return <SuccessWithKids kids={kids} />;
  }
  // If there are no linked kids accounts, return original success component
  return (
    <ContentWrapper
      header={formatMessage(messages.title)}
      iconComponent={CheckmarkCircleStroke}
      subheader={formatMessage(newDesign ? messages.subtitle2 : messages.subtitle)}
      newDesign={newDesign}
    >
      <Link to={WEB_ROUTES.home} className={activationStyles.buttonLink}>
        {formatMessage(newDesign ? messages.link2 : messages.link)}
      </Link>
    </ContentWrapper>
  );
};

export default Success;
