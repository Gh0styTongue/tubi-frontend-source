import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ArrowIcon } from 'ott/features/playback/containers/OTTLivePlayback/Icons';

import styles from './MoreDetailBottom.scss';

interface ModeDetailBottomProps {
  onClick: () => void;
}

const messages = defineMessages({
  moreDetails: {
    description: 'more details',
    defaultMessage: 'More Details',
  },
});

const MoreDetailBottom: React.FunctionComponent<ModeDetailBottomProps> = (props) => {
  const intl = useIntl();
  return (
    <div className={classNames(styles.moreDetail)} onClick={props.onClick} role="presentation">
      <div className={styles.moreDetailText}>
        {intl.formatMessage(messages.moreDetails)}
      </div>
      <div className={styles.moreDetailIcon}>
        <ArrowIcon />
      </div>
    </div>
  );
};

export default MoreDetailBottom;
