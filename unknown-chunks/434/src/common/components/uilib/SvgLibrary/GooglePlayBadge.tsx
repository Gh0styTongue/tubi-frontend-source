import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import GoogleBadgeSpanish from 'common/theme/icons/google-play-badge-es.svg';
import GoogleBadge from 'common/theme/icons/google-play-badge.svg';

const messages = defineMessages({
  googlePlay: {
    description: 'Hint text for Google Play badge',
    defaultMessage: 'Google Play',
  },
});

const GooglePlayBadge: React.FC<{ isSpanishLanguage: boolean }> = ({ isSpanishLanguage }): JSX.Element => {
  const intl = useIntl();
  return (
    <img
      src={isSpanishLanguage ? GoogleBadgeSpanish : GoogleBadge}
      alt={intl.formatMessage(messages.googlePlay)}
    />
  );
};

export default GooglePlayBadge;
