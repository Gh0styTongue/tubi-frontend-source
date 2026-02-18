import classNames from 'classnames';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';

import styles from './AutoPlayMinimizedDetail.scss';

const messages = defineMessages({
  startingIn: {
    defaultMessage: 'Starting in {seconds}s',
    description: 'starting in an amount of seconds',
  },
  playingNext: {
    defaultMessage: 'Playing Next',
    description: 'indicates that a video is playing after the current video ends',
  },
});

export interface AutoPlayMinimizedDetailProps {
  title: string,
  toUrl: string,
  onLinkClick: (e: React.MouseEvent) => void,
}

const AutoPlayMinimizedDetail: React.FunctionComponent<AutoPlayMinimizedDetailProps> = ({
  title,
  toUrl,
  onLinkClick,
}) => {
  const intl = useIntl();
  const handleLinkClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    onLinkClick(event);
  }, [onLinkClick]);

  return (
    <div className={classNames(styles.minimizedDetail)} data-test-id="autoplay-minimized">
      <div className={classNames(styles.title)}>
        <Link onClick={handleLinkClick} to={toUrl}>
          {title}
        </Link>
      </div>
      <div className={styles.prompt}>{intl.formatMessage(messages.playingNext)}</div>
    </div>
  );
};
export default AutoPlayMinimizedDetail;
