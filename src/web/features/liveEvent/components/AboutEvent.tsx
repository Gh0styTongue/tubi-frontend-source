/* istanbul ignore file */
import React from 'react';
import { injectIntl } from 'react-intl';
import type { WrappedComponentProps } from 'react-intl';

import TimelineBanner from './TimelineBanner/TimelineBanner';
import styles from '../containers/LiveEventDetails/LiveEventDetails.scss';
import messages from '../messages';

const AboutEvent: React.FC<WrappedComponentProps> = ({ intl }) => {
  return (
    <div className={styles.content}>
      <h2 className={styles.title}>{intl.formatMessage(messages.liveEventTitle)}</h2>
      <p className={styles.description}>{intl.formatMessage(messages.liveEventDescription, {
        LineBreak: () => <br />,
      })}</p>
      <p className={styles.subDescription}>{intl.formatMessage(messages.liveEventDescriptionTip)}</p>

      <TimelineBanner />
    </div>
  );
};

export default injectIntl(AboutEvent);
