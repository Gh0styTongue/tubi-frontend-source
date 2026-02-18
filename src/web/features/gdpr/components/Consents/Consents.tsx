import { OnOffSwitch } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import messages from 'common/features/gdpr/messages';
import type { OptionalConsentValue } from 'common/features/gdpr/types';
import { toggleConsentValue } from 'common/features/gdpr/utils';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from './Consents.scss';

interface ConsentsProps {
  className?: string;
  displayedValues?: Record<string, OptionalConsentValue>;
  onConsentChange: (key: string, value: OptionalConsentValue) => void;
}

const Consents = ({ className, displayedValues, onConsentChange }: ConsentsProps) => {
  const intl = useIntl();
  const consents = useAppSelector((state) => state.consent.consents);
  const consentItems = consents.map(({ title, subtitle, key, value }) => {
    const displayedValue = displayedValues?.[key] || value;
    return (
      <div className={styles.consentItem}>
        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          <div className={styles.subtitle}>{subtitle}</div>
        </div>
        <div className={styles.value}>
          {displayedValue === 'required' ? (
            intl.formatMessage(messages.required)
          ) : (
            <OnOffSwitch
              switchOn={displayedValue === 'opted_in'}
              onChange={() => onConsentChange(key, toggleConsentValue(displayedValue))}
            />
          )}
        </div>
      </div>
    );
  });
  return <div className={classNames(styles.container, className)}>{consentItems}</div>;
};

export default Consents;
