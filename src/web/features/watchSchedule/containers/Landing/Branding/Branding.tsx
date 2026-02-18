import React from 'react';
import { useIntl } from 'react-intl';

import DeviceList from 'web/components/DeviceList/DeviceList';

import styles from './Branding.scss';
import messages from './brandingMessages';
import ResponsiveContent from './ResponsiveContent/ResponsiveContent';

const Branding = () => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <h2>{formatMessage(messages.title)}</h2>
        <p className={styles.desc}>{formatMessage(messages.description)}</p>
      </div>

      <ResponsiveContent />
      <DeviceList className={styles.main} />
    </div>
  );
};

export default Branding;
