import { PlayButton } from '@tubitv/web-ui';
import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { History } from 'common/types/history';
import { trackMobilePlayButtonClick } from 'common/utils/logging';

import styles from './PlayerArea.scss';

const messages = defineMessages({
  play: {
    description: 'Play button text',
    defaultMessage: 'Play',
  },
});

interface Props {
  title: string,
  id: string,
  duration: number,
  onClick?: VoidFunction;
  viewHistory?: History,
}

class MobilePlayButton extends PureComponent<Props> {
  getResumePosition = () => {
    const { viewHistory } = this.props;
    if (!viewHistory) return 0;

    const { contentType, position, id } = viewHistory;
    let resumePosition = position || 0;

    if (contentType === 'series') {
      let episodeHistory;
      const episodes = viewHistory.episodes || [];
      for (const ep in episodes) {
        if (episodes[ep].contentId === parseInt(id, 10)) {
          episodeHistory = episodes[ep];
          break;
        }
      }

      resumePosition = episodeHistory ? episodeHistory.position : 0;
    }

    return resumePosition;
  };

  handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { id, title, onClick } = this.props;
    trackMobilePlayButtonClick(id, title);
    onClick?.();
  };

  render() {
    const { viewHistory, duration } = this.props;
    const position = viewHistory ? this.getResumePosition() : 0;

    return (
      <div className={styles.mobilePlayButton} onClick={this.handleClick} data-test-id="mobile-play-button">
        <PlayButton label={<FormattedMessage {...messages.play} />} onClick={this.handleClick} />
        {
          position ? (
            <div className={styles.progressWrapper}>
              <div className={styles.progress} style={{ width: `${position / duration * 100}%` }} />
            </div>
          ) : null
        }
      </div>
    );
  }
}

export default MobilePlayButton;
