import { CreditCardOff, Video as VideoIcon } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { usePlayerRegisterLogInButtons } from 'web/features/playback/components/WebPlayer/hooks/usePlayerRegisterLogInButtons';

import styles from './PreviewBanner.scss';

const messages = defineMessages({
  free: {
    description: 'free label',
    defaultMessage: 'FREE',
  },
  enjoyPreviewTitle: {
    description: 'Enjoy preview banner title',
    defaultMessage: 'Enjoy a 15 minute preview',
  },
  signUpFreeWatchFull: {
    description: 'Sign up for free to watch unlimited movies and shows',
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

interface PreviewBannerProps {
  videoId: string;
  position: number;
  customClassName?: string;
}

const PreviewBanner: React.FC<PreviewBannerProps> = ({ videoId, position, customClassName }) => {
  const { formatMessage } = useIntl();
  const { handleSignUpClick, handleSignInClick } = usePlayerRegisterLogInButtons({ videoId, position });

  return (
    <div className={classNames(styles.previewBanner, customClassName)} data-test-id="preview-banner">
      <div className={styles.previewBannerContent}>
        <div className={styles.previewBannerText}>
          <p className={styles.previewBannerTitle}>
            {formatMessage(messages.enjoyPreviewTitle)}
          </p>
          <p className={styles.previewBannerSubtitle}>
            {formatMessage(messages.signUpFreeWatchFull)}
          </p>
        </div>

        <div className={styles.previewBannerActions}>
          <div className={styles.previewBannerButtons}>
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

          <div className={styles.previewBannerFeatures}>
            <div className={styles.previewBannerFeature}>
              <div className={styles.previewBannerIcon}>
                <VideoIcon />
              </div>
              <div className={styles.previewBannerFeatureText}>
                <p className={styles.previewBannerFeatureTitle}>
                  {formatMessage(messages.saveProgress)}
                </p>
                <p className={styles.previewBannerFeatureDescription}>
                  {formatMessage(messages.saveProgressDescription)}
                </p>
              </div>
            </div>

            <div className={styles.previewBannerFeature}>
              <div className={styles.previewBannerIcon}>
                <CreditCardOff />
              </div>
              <div className={styles.previewBannerFeatureText}>
                <p className={styles.previewBannerFeatureTitle}>
                  {formatMessage(messages.freeForever)}
                </p>
                <p className={styles.previewBannerFeatureDescription}>
                  {formatMessage(messages.freeForeverDescription)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewBanner;

