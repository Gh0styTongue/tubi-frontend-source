import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { CreditCardOff, Video } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import * as eventTypes from 'common/constants/event-types';
import { VIDEO_REG_GATE_TIME_THRESHOLD } from 'common/constants/player';
import type { Video as VideoType } from 'common/types/video';
import { buildDialogEvent } from 'common/utils/analytics';
import { exitFullscreen } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { exitPictureInPicture } from 'common/utils/pictureInPicture';
import { trackEvent } from 'common/utils/track';
import RegGatePreviewTimer from 'web/features/playback/components/RegGatePreviewTimer/RegGatePreviewTimer';
import { usePlayerRegisterLogInButtons } from 'web/features/playback/components/WebPlayer/hooks/usePlayerRegisterLogInButtons';

import styles from './WebPlayerRegisterGateOverlay.scss';

const messages = defineMessages({
  title: {
    description: 'Registration gate title',
    defaultMessage: 'Your preview is over. Hate cliffhangers?',
  },
  subtitle: {
    description: 'Registration gate subtitle',
    defaultMessage: 'Sign up for free to watch unlimited movies & shows.',
  },
  signUp: {
    description: 'Sign up button text',
    defaultMessage: 'Sign Up',
  },
  signIn: {
    description: 'Sign in button text',
    defaultMessage: 'Sign In',
  },
  free: {
    description: 'Free badge text',
    defaultMessage: 'FREE',
  },
  saveProgress: {
    description: 'Save progress feature title',
    defaultMessage: 'Save Your Progress',
  },
  saveProgressDescription: {
    description: 'Save progress feature description',
    defaultMessage: 'Pick up where you left off',
  },
  freeForever: {
    description: 'Free forever feature title',
    defaultMessage: 'Free Forever',
  },
  freeForeverDescription: {
    description: 'Free forever feature description',
    defaultMessage: 'No credit card required',
  },
});

interface WebPlayerRegisterGateOverlayProps {
  video: VideoType;
  position: number;
  customClassName?: string;
}

const WebPlayerRegisterGateOverlay: React.FC<WebPlayerRegisterGateOverlayProps> = ({ video, position, customClassName }) => {
  const { formatMessage } = useIntl();
  const { handleSignUpClick, handleSignInClick } = usePlayerRegisterLogInButtons({ videoId: video.id, position, fromGateOverlay: true });

  // Exit fullscreen and picture-in-picture when the register gate overlay is shown
  useEffect(() => {
    exitFullscreen();
    exitPictureInPicture().catch(() => {
      // Silently handle any errors from exiting PiP
    });
    trackEvent(
      eventTypes.DIALOG,
      buildDialogEvent(getCurrentPathname(), DialogType.REGISTRATION, 'reg_gt_watch', DialogAction.SHOW)
    );
  }, []);

  return (
    <div className={styles.registerGateOverlay} data-test-id="web-player-register-gate-overlay">
      {/* Title at the top */}
      <div className={styles.topArea}>
        <div className={styles.videoTitle}>
          {video.title}
        </div>
        <RegGatePreviewTimer position={VIDEO_REG_GATE_TIME_THRESHOLD} active showText={false} customClassName={customClassName} />
      </div>

      {/* Bottom overlay with gradient */}
      <div className={styles.bottomOverlay}>
        <div className={styles.contentContainer}>
          <div className={styles.textContent}>
            <p className={styles.mainTitle}>
              {formatMessage(messages.title)}
            </p>
            <p className={styles.subtitle}>
              {formatMessage(messages.subtitle)}
            </p>
          </div>

          <div className={styles.featuresRow}>
            <div className={styles.buttonGroup}>
              <Button
                appearance="primary"
                onClick={handleSignUpClick}
                tag={formatMessage(messages.free)}
              >
                {formatMessage(messages.signUp)}
              </Button>

              <Button
                appearance="secondary"
                onClick={handleSignInClick}
              >
                {formatMessage(messages.signIn)}
              </Button>
            </div>

            <div className={styles.featuresContainer}>
              <div className={styles.featureItem}>
                <div className={styles.iconWrapper}>
                  <Video />
                </div>
                <div className={styles.featureText}>
                  <p className={styles.featureTitle}>
                    {formatMessage(messages.saveProgress)}
                  </p>
                  <p className={styles.featureDescription}>
                    {formatMessage(messages.saveProgressDescription)}
                  </p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.iconWrapper}>
                  <CreditCardOff />
                </div>
                <div className={styles.featureText}>
                  <p className={styles.featureTitle}>
                    {formatMessage(messages.freeForever)}
                  </p>
                  <p className={styles.featureDescription}>
                    {formatMessage(messages.freeForeverDescription)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPlayerRegisterGateOverlay;

