import { LockFilled24 } from '@tubitv/icons';
import React from 'react';
import { useIntl } from 'react-intl';

import messages from './messages';
import styles from './SignInRequiredText.scss';

interface Props {
  marginTop?: string;
  marginBottom?: string;
}

const SignInRequiredText = ({ marginTop, marginBottom }: Props) => {
  const { formatMessage } = useIntl();
  const style = {
    marginTop,
    marginBottom,
  };

  return (
    <div className={styles.root} style={style}>
      <LockFilled24 />
      <span className={styles.text}>{formatMessage(messages.text)}</span>
    </div>
  );
};

export default SignInRequiredText;
