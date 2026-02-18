import React, { Component } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { Play } from 'common/components/uilib/SvgLibrary/ControlIcons';
import type StoreState from 'common/types/storeState';

import styles from './ChromecastPlayButton.scss';

const messages = defineMessages({
  cast: {
    description: 'video is currently casting message',
    defaultMessage: 'Casting Now',
  },
});

interface StateProps {
  currentVideoIsCasting: boolean;
  castVideoLoading: boolean;
  castVideoLoadError?: string;
  position: number;
  duration: number;
}
interface Props {
  contentId: string;
  castContent: () => void;
  className: string;
}

export type ChromecastPlayButtonProps = Props & StateProps;

/**
 * while casting, this will render in video detail page
 * if this video is the one that is casting, show a message with a progress bar
 * if another video is casting, this will render a play button and click will cast this video
 */
export class ChromecastPlayButton extends Component<ChromecastPlayButtonProps> {
  constructor(props: ChromecastPlayButtonProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { castContent, currentVideoIsCasting, castVideoLoading, castVideoLoadError } = this.props;
    if (castVideoLoading || (currentVideoIsCasting && !castVideoLoadError)) return;
    castContent();
  }

  render() {
    const { currentVideoIsCasting, className, position, duration, castVideoLoadError, castVideoLoading } = this.props;

    let iconElement = <Play className={styles.playPause} />;
    if (currentVideoIsCasting && !castVideoLoadError && !castVideoLoading) {
      iconElement = (
        <div className={styles.castingMessage}>
          <div className={styles.text}><FormattedMessage {...messages.cast} /></div>
          {
            (position && duration) ? (
              <div className={styles.progressWrapper}>
                <div className={styles.progress} style={{ width: `${position / duration * 100}%` }} />
              </div>
            ) : null
          }
        </div>
      );
    }

    return (
      <div className={className} onClick={this.handleClick}>
        <span key="playPause" className={styles.playbackButton}>
          {iconElement}
        </span>
      </div>
    );
  }
}

export const mapStateToProps = ({ chromecast, video: { byId } }: StoreState, { contentId }: Props): StateProps => {
  const { contentId: castingContentId, position, castVideoLoading, castVideoLoadError } = chromecast;
  const { duration } = byId[contentId] || {};
  return {
    currentVideoIsCasting: castingContentId === contentId,
    castVideoLoading,
    castVideoLoadError,
    position,
    duration,
  };
};
export default connect(mapStateToProps)(ChromecastPlayButton);
