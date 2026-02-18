import React from 'react';
import { useIntl } from 'react-intl';

import commonStyles from '../common.scss';
import messages from '../messages';
import styles from './Setup.scss';
import SetupForm from './SetupForm';

const Setup = () => {
  const { formatMessage } = useIntl();
  return (
    <div className={commonStyles.main}>
      <div className={styles.illustration} />
      <h1>{formatMessage(messages.setupKidsAccountHeader)}</h1>
      <p>{formatMessage(messages.setupKidsAccountDesc)}</p>
      <SetupForm />
    </div>
  );
};

export default Setup;
