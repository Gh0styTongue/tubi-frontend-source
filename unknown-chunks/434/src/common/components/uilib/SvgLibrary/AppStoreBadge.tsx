import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import AppleBadgeSpanish from 'common/theme/icons/apple-store-badge-es.svg';
import AppleBadge from 'common/theme/icons/apple-store-badge.svg';

const messages = defineMessages({
  appStore: {
    description: 'Hint text for iOS App Store badge',
    defaultMessage: 'App Store - Apple',
  },
});

const AppStoreBadge: React.FC<{ isSpanishLanguage: boolean; }> = ({ isSpanishLanguage }): JSX.Element => {
  const intl = useIntl();
  return (
    <img
      src={isSpanishLanguage ? AppleBadgeSpanish : AppleBadge}
      alt={intl.formatMessage(messages.appStore)}
    />
  );
};

export default AppStoreBadge;
