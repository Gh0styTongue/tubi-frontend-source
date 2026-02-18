import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import styles from './ComingSoonLabel.scss';

const messages = defineMessages({
  label: {
    description: 'label text for titles coming soon',
    defaultMessage: 'Coming <date></date>',
  },
});

interface Props {
  date?: string | null,
  className?: string,
}

export const formatComingSoonString = (date: Props['date'], intl: IntlShape) => {
  if (!date) {
    return '';
  }
  const dateValue = new Date(date);
  return intl.formatMessage(messages.label, {
    date: () => intl.formatDate(dateValue, {
      month: 'short',
      day: 'numeric',
    }),
  });
};

const ComingSoonLabel: FC<Props> = ({ date, className }) => {
  const intl = useIntl();
  const comingSoonString = formatComingSoonString(date, intl);

  return comingSoonString ? (
    <div className={classNames(styles.label, className)}>
      {comingSoonString}
    </div>
  ) : null;
};

export default ComingSoonLabel;
