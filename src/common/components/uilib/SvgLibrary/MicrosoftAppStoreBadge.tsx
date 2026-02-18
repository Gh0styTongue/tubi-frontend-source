import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import MicrosoftBadgeSpanish from 'common/theme/icons/microsoft-app-store-badge-es.svg';
import MicrosoftBadge from 'common/theme/icons/microsoft-app-store-badge.svg';

const messages = defineMessages({
  appStore: {
    description: 'Hint text for Microsoft App Store badge',
    defaultMessage: 'App Store - Microsoft',
  },
});

const MicrosoftAppStoreBadge: React.FC<{ isSpanishLanguage: boolean }> = ({ isSpanishLanguage }): JSX.Element => {
  const intl = useIntl();
  return (
    <img
      src={isSpanishLanguage ? MicrosoftBadgeSpanish : MicrosoftBadge}
      alt={intl.formatMessage(messages.appStore)}
    />
  );
};

export default MicrosoftAppStoreBadge;

