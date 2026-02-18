import { CreditCardOff, Search, Account24 } from '@tubitv/icons';
import { Container } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import messages from './messages';
import styles from './RegistrationValue.scss';
import RegisterButton from '../RegisterButton/RegisterButton';

type ValueProp = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const ValuePropItem = ({ Icon, title, description }: ValueProp) => (
  <div className={styles.valuePropItem}>
    {/* eslint-disable-next-line react/forbid-component-props */}
    <Icon className={styles.valuePropIcon} />
    <div className={styles.valuePropContent}>
      <div className={styles.valuePropItemTitle}>{title}</div>
      <div className={styles.valuePropItemDescription}>{description}</div>
    </div>
  </div>
);

interface RegistrationValueProps {
  variation: number;
}

const RegistrationValue = ({ variation }: RegistrationValueProps) => {
  const { formatMessage } = useIntl();

  const registrationValueStyles = classNames(
    styles.registrationValue,
    {
      [styles.projectorVariant]: variation === 2,
    },
  );

  const valueProps: ValueProp[] = [
    {
      Icon: CreditCardOff,
      title: formatMessage(messages.valuePropOne),
      description: formatMessage(messages.valuePropOneDescription),
    },
    {
      Icon: Search,
      title: formatMessage(messages.valuePropTwo),
      description: formatMessage(messages.valuePropTwoDescription),
    },
    {
      Icon: Account24,
      title: formatMessage(messages.valuePropThree),
      description: formatMessage(messages.valuePropThreeDescription),
    },
  ];

  return (
    <div className={registrationValueStyles}>
      <Container>
        <div className={styles.contentWrapper}>
          <div className={styles.titleContainer}>
            <div className={styles.title}>{formatMessage(messages.title)}</div>
            <div className={styles.subtitle}>{formatMessage(messages.subtitle)}</div>
          </div>
          <div className={styles.valuePropContainer}>
            {valueProps.map((p, i) => (
              <ValuePropItem key={i} {...p} />
            ))}
          </div>
          <div className={styles.ctaRow}>
            {/* eslint-disable-next-line react/forbid-component-props */}
            <RegisterButton className={styles.signUpButton}>{formatMessage(messages.signUpButton)}</RegisterButton>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default RegistrationValue;
