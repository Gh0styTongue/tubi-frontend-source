import { Tooltip } from '@tubitv/web-ui';
import React, { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import ChromecastIcon from 'common/components/uilib/ChromecastIcon/ChromecastIcon';

import styles from '../../WebPlayerOverlay.scss';

const messages = defineMessages({
  cast: {
    description: 'cast to device icon label text',
    defaultMessage: 'Play on TV',
  },
});

export interface ChromecastButtonProps {
  placement?: 'top' | 'bottom';
}

const ChromecastButton = ({ placement = 'top' }: ChromecastButtonProps) => {
  const intl = useIntl();
  const memoizedChromecastIcon = useMemo(() => <ChromecastIcon className={styles.icon} />, []);

  const handleChromecastClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <span key="cast" id="castButtonArea" className={styles.extraControl} onClick={handleChromecastClick}>
      <div className={styles.castButton}>
        <Tooltip label={intl.formatMessage(messages.cast)} placement={placement}>
          {memoizedChromecastIcon}
        </Tooltip>
      </div>
    </span>
  );
};

export default ChromecastButton;
