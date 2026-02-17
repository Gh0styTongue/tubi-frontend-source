/* istanbul ignore file */

import { PLAYER_ERROR_DETAILS } from '@adrise/player';
import Analytics from '@tubitv/analytics';
import { Button } from '@tubitv/web-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { CSSTransition } from 'react-transition-group';

import { isIncognito } from 'client/utils/web';
import CloseX from 'common/components/uilib/SvgLibrary/CloseX';
import ThemeProvider from 'common/features/theme/ThemeProvider';
import useModal from 'web/hooks/useModal';

import styles from './WebErrorModal.scss';

const MIN_BROWSER_VERSION_FOR_CDM = 128;

// transition class
const overlayClassNames = {
  appear: styles.webErrorModalOverlayFadeAppear,
  appearActive: styles.webErrorModalOverlayFadeAppearActive,
  appearDone: styles.webErrorModalOverlayFadeAppearDone,
  enter: styles.webErrorModalOverlayFadeEnter,
  enterActive: styles.webErrorModalOverlayFadeEnterActive,
  enterDone: styles.webErrorModalOverlayFadeEnterDone,
  exit: styles.webErrorModalOverlayFadeExit,
  exitActive: styles.webErrorModalOverlayFadeExitActive,
  exitDone: styles.webErrorModalOverlayFadeExitDone,
};

const contentClassNames = {
  appear: styles.webErrorModalContentSlideAppear,
  appearActive: styles.webErrorModalContentSlideAppearActive,
  appearDone: styles.webErrorModalContentSlideAppearDone,
  enter: styles.webErrorModalContentSlideEnter,
  enterActive: styles.webErrorModalContentSlideEnterActive,
  enterDone: styles.webErrorModalContentSlideEnterDone,
  exit: styles.webErrorModalContentSlideExit,
  exitActive: styles.webErrorModalContentSlideExitActive,
  exitDone: styles.webErrorModalContentSlideExitDone,
};

const messages = defineMessages({
  buttonBack: {
    description: 'back button text',
    defaultMessage: 'Back',
  },
  buttonTryAgain: {
    description: 'try again button text',
    defaultMessage: 'Try Again',
  },
  errorContentAdditionalHelp1: {
    description: 'additional help',
    defaultMessage: 'Additional Help',
  },
  errorContentAdditionalHelp2: {
    description: 'if this persists, contact us us at',
    defaultMessage: 'If this persists, contact us at',
  },
  errorContentDrm1: {
    description: 'we are having issues playing this protected content',
    defaultMessage: 'We are having issues playing this protected content',
  },
  errorContentDrm2: {
    description: 'to fix this:',
    defaultMessage: 'To fix this:',
  },
  errorContentDrm3: {
    description: 'refresh the page',
    defaultMessage: 'Refresh the page',
  },
  errorContentDrm4: {
    description: 'reset your network connection',
    defaultMessage: 'Reset your network connection',
  },
  errorContentDrm5: {
    description: 'clear your browser cache',
    defaultMessage: 'Clear your browser cache',
  },
  errorContentDrm6: {
    description: 'try playing a different movie/show',
    defaultMessage: 'Try playing a different movie/show',
  },
  errorContentDrmIncognito: {
    description: 'Disable incognito mode',
    defaultMessage: 'Disable incognito mode',
  },
  errorContentDRMUpgradeBrowser: {
    description: 'Suggest user update the browser to avoid DRM errors to resolve the playback issue.',
    defaultMessage: 'Update to the latest browser version',
  },
  checkDRMGuidance: {
    description: 'We will link the user to a help center article if they want detailed guidance.',
    defaultMessage: 'For detailed guidance, please click',
  },
  here: {
    description: 'Anchor for the link',
    defaultMessage: 'here',
  },
  errorContentHdcp1: {
    description: 'it looks like hdcp isn\'t supported by your hdmi connection',
    defaultMessage: 'It looks like HDCP isn\'t supported by your HDMI connection',
  },
  errorContentHdcp2: {
    description: 'to fix this:',
    defaultMessage: 'To fix this:',
  },
  errorContentHdcp3: {
    description: 'use a different hdmi cable that supports hdcp',
    defaultMessage: 'Use a different HDMI cable that supports HDCP',
  },
  errorContentHdcp4: {
    description: 'unplug and reconnect the hdmi cable from your device and tv',
    defaultMessage: 'Unplug and reconnect the HDMI cable from your device and TV',
  },
  errorContentHdcp5: {
    description: 'try a different hdmi input on your tv',
    defaultMessage: 'Try a different HDMI input on your TV',
  },
  errorContentHdcp6: {
    description: 'restart your device and try again',
    defaultMessage: 'Restart your device and try again',
  },
  errorContentHdcp7: {
    description: 'try another display that supports hdcp',
    defaultMessage: 'Try another display that supports HDCP',
  },
  errorContentHdcp8: {
    description: 'what is hdcp?',
    defaultMessage: 'What is HDCP?',
  },
  errorContentHdcp9: {
    description: 'high-bandwidth digital content protection (hdcp) is a form of digital copy protection to prevent copying of digital, audio & video content as it plays between devices.',
    defaultMessage: 'High-bandwidth Digital Content Protection (HDCP) is a form of digital copy protection to prevent copying of digital, audio & video content as it plays between devices.',
  },
  errorAdRequestBlock1: {
    description: 'having trouble with playback? We\'re here to help!',
    defaultMessage: 'Having trouble with playback? We\'re here to help!',
  },
  errorAdRequestBlock2: {
    description: 'first, kindly check your network connection to ensure everything is running smoothly.',
    defaultMessage: 'First, kindly check your network connection to ensure everything is running smoothly.',
  },
  errorAdRequestBlock3: {
    description: 'sometimes, ad-blocking extensions can also interfere with video playback. If you have any installed, try disabling or uninstalling them to see if that fixes the issue.',
    defaultMessage: 'Sometimes, ad-blocking extensions can also interfere with video playback. If you have any installed, try disabling or uninstalling them to see if that fixes the issue.',
  },
  errorAdRequestBlock4: {
    description: 'need more assistance? No worries, we\'re just a click away. Visit us at',
    defaultMessage: 'Need more assistance? No worries, we\'re just a click away. Visit us at',
  },
  errorAdRequestBlock5: {
    description: 'and we\'ll work together to get your streaming experience back on track.',
    defaultMessage: 'and we\'ll work together to get your streaming experience back on track.',
  },
  errorTitleDrm: {
    description: 'digital rights management (drm) error',
    defaultMessage: 'Digital Rights Management (DRM) Error',
  },
  errorTitleHdcp: {
    description: 'hdcp is required to play this content',
    defaultMessage: 'HDCP is required to play this content',
  },
  errorTitleAd: {
    description: 'ads load error title: Playback Issue',
    defaultMessage: 'Playback Issue',
  },
  errorTitleLive: {
    description: 'live playback error',
    defaultMessage: 'Live Playback Error',
  },
  errorContentLive1: {
    description: 'we are having issues playing this live content',
    defaultMessage: 'We are having issues playing this live content',
  },
  errorContentLive2: {
    description: 'Check your network settings',
    defaultMessage: 'Check your network settings',
  },
  errorContentLive3: {
    description: 'Click try again button below to retry',
    defaultMessage: 'Click try again button to retry',
  },
});

export interface WebErrorModalProps {
  isOpen: boolean;
  onClose?: (isRetry: boolean) => void;
  playerErrorDetails?: typeof PLAYER_ERROR_DETAILS[keyof typeof PLAYER_ERROR_DETAILS];
}

const WebErrorModal: React.FunctionComponent<WebErrorModalProps> = ({ isOpen, onClose, playerErrorDetails }) => {
  const intl = useIntl();

  // determine whether modal is closed by "close" or "retry" button
  const retryRef = useRef(false);

  // transition control and use count to close modal after transition completed
  const transitionRef = useRef(0);
  const [isTransitionIn, setTransitionIn] = useState(false);

  const handleTransitionEnter = useCallback(() => {
    transitionRef.current++;
  }, []);

  const handleTransitionExited = useCallback(() => {
    transitionRef.current--;
    if (transitionRef.current === 0 && onClose) {
      onClose(retryRef.current);
    }
  }, [onClose]);

  // set up modal
  const { closeModal, Modal, openModal } = useModal({ isDefaultOpen: isOpen });

  const handleExit = useCallback(() => {
    retryRef.current = false;
    setTransitionIn(false);
  }, [setTransitionIn]);

  const handleRetry = useCallback(() => {
    retryRef.current = true;
    setTransitionIn(false);
  }, [setTransitionIn]);

  const needUpgradeBrowser = (playerErrorDetails?: typeof PLAYER_ERROR_DETAILS[keyof typeof PLAYER_ERROR_DETAILS]) => {
    const deviceInfo = Analytics.getAnalyticsConfig();
    const browserVersion = deviceInfo && deviceInfo.browser_version ? Number(deviceInfo.browser_version) : Number.POSITIVE_INFINITY;
    const browserName = deviceInfo && deviceInfo.browser_name;
    return playerErrorDetails === PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_REQUEST_FAILED
      && browserName === 'Chrome'
      && browserVersion < MIN_BROWSER_VERSION_FOR_CDM;
  };

  // control modal by "isOpen" props
  useEffect(() => {
    if (isOpen) {
      openModal();
      setTransitionIn(true);
    } else {
      closeModal();
    }
  }, [setTransitionIn, closeModal, openModal, isOpen]);

  // prevent default
  const handlePreventDefault = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const getModalHeadMsg = () => {
    let message = '';
    switch (playerErrorDetails) {
      case PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE:
        message = intl.formatMessage(messages.errorTitleHdcp);
        break;
      case PLAYER_ERROR_DETAILS.LIVE_PLAYBACK_ERROR:
      case PLAYER_ERROR_DETAILS.AD_REQUEST_BLOCKED_ERROR:
        message = intl.formatMessage(messages.errorTitleAd);
        break;
      default:
        message = intl.formatMessage(messages.errorTitleDrm);
    }
    return message;
  };

  const getModalBody = () => {
    if (playerErrorDetails === PLAYER_ERROR_DETAILS.AD_REQUEST_BLOCKED_ERROR) {
      return (<section className={styles.webErrorModalContentBodyDescription}>
        <div className={styles.webErrorModalContentBodyBold}>{intl.formatMessage(messages.errorAdRequestBlock1)}</div>
        <ul>
          {
            [2, 3].map(index => (
              <li key={index}>{intl.formatMessage(messages[`errorAdRequestBlock${index}`])}</li>
            ))
          }
        </ul>
        {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs */}
        <div>{intl.formatMessage(messages.errorAdRequestBlock4)} <a href="https://tubitv.com/support" target="_blank">tubitv.com/support</a> {intl.formatMessage(messages.errorAdRequestBlock5)}</div>
      </section>);
    } if (playerErrorDetails === PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE) {
      return (<section className={styles.webErrorModalContentBodyDescription}>
        <p>
          <b>{intl.formatMessage(messages.errorContentHdcp1)}</b>
        </p>
        <p>
          <b>{intl.formatMessage(messages.errorContentHdcp2)}</b>
        </p>
        <ul>
          <li>{intl.formatMessage(messages.errorContentHdcp3)}</li>
          {isIncognito() ? <li>{intl.formatMessage(messages.errorContentDrmIncognito)}</li> : null}
          <li>{intl.formatMessage(messages.errorContentHdcp4)}</li>
          <li>{intl.formatMessage(messages.errorContentHdcp5)}</li>
          <li>{intl.formatMessage(messages.errorContentHdcp6)}</li>
          <li>{intl.formatMessage(messages.errorContentHdcp7)}</li>
        </ul>
        <p>
          <b>{intl.formatMessage(messages.errorContentHdcp8)}</b>
        </p>
        <div>{intl.formatMessage(messages.errorContentHdcp9)}</div>
        <p>
          <b>{intl.formatMessage(messages.errorContentAdditionalHelp1)}</b>
        </p>
        <div>
          {intl.formatMessage(messages.errorContentAdditionalHelp2)}
          {' '}
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs */}
          <a href="https://tubitv.com/support" target="_blank">tubitv.com/support</a>
        </div>
      </section>);
    } if (playerErrorDetails === PLAYER_ERROR_DETAILS.LIVE_PLAYBACK_ERROR) {
      return (<section className={styles.webErrorModalContentBodyDescription}>
        <p>
          <b>{intl.formatMessage(messages.errorContentLive1)}</b>
        </p>
        <p>
          <b>{intl.formatMessage(messages.errorContentDrm2)}</b>
        </p>
        <ul>
          <li>{intl.formatMessage(messages.errorContentDrm3)}</li>
          <li>{intl.formatMessage(messages.errorContentDrm4)}</li>
          <li>{intl.formatMessage(messages.errorContentDrm5)}</li>
          <li>{intl.formatMessage(messages.errorContentDrm6)}</li>
        </ul>
        <p>
          <b>{intl.formatMessage(messages.errorContentAdditionalHelp1)}</b>
        </p>
        <div>
          {intl.formatMessage(messages.errorContentAdditionalHelp2)}
          {' '}
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs */}
          <a href="https://tubitv.com/support" target="_blank">tubitv.com/support</a>
        </div>
      </section>);
    }

    return (<section className={styles.webErrorModalContentBodyDescription}>
      <p>
        <b>{intl.formatMessage(messages.errorContentDrm1)}</b>
      </p>
      <p>
        <b>{intl.formatMessage(messages.errorContentDrm2)}</b>
      </p>
      <ul>
        {needUpgradeBrowser(playerErrorDetails) ? <li className={styles.webErrorModalContentBodyBold}>{intl.formatMessage(messages.errorContentDRMUpgradeBrowser)}</li> : null}
        <li>{intl.formatMessage(messages.errorContentDrm3)}</li>
        {isIncognito() ? <li>{intl.formatMessage(messages.errorContentDrmIncognito)}</li> : null}
        <li>{intl.formatMessage(messages.errorContentDrm4)}</li>
        <li>{intl.formatMessage(messages.errorContentDrm5)}</li>
        <li>{intl.formatMessage(messages.errorContentDrm6)}</li>
        {needUpgradeBrowser(playerErrorDetails) ? null : <li>{intl.formatMessage(messages.errorContentDRMUpgradeBrowser)}</li>}
        <li>{intl.formatMessage(messages.checkDRMGuidance)} <a href="https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410077357467" target="_blank">{intl.formatMessage(messages.here)}</a></li>
      </ul>
      <p>
        <b>{intl.formatMessage(messages.errorContentAdditionalHelp1)}</b>
      </p>
      <div>
        {intl.formatMessage(messages.errorContentAdditionalHelp2)}
        {' '}
        {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for URLs */}
        <a href="https://tubitv.com/support" target="_blank">tubitv.com/support</a>
      </div>
    </section>);
  };

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal>
      <ThemeProvider>
        <div className={styles.webErrorModalRoot}>
          <CSSTransition
            appear
            classNames={overlayClassNames}
            in={isTransitionIn}
            onEnter={handleTransitionEnter}
            onExited={handleTransitionExited}
            timeout={300}
            nodeRef={overlayRef}
          >
            <div ref={overlayRef} className={styles.webErrorModalOverlay} onClick={handleExit} />
          </CSSTransition>
          <CSSTransition
            appear
            classNames={contentClassNames}
            in={isTransitionIn}
            onEnter={handleTransitionEnter}
            onExited={handleTransitionExited}
            timeout={300}
            nodeRef={dialogRef}
          >
            <div ref={dialogRef} className={styles.webErrorModalDialog} onClick={handlePreventDefault}>
              <div className={styles.webErrorModalContent}>
                <div className={styles.webErrorModalContentHead}>
                  <span>
                    { getModalHeadMsg() }
                  </span>
                  {
                    playerErrorDetails === PLAYER_ERROR_DETAILS.AD_REQUEST_BLOCKED_ERROR ? null :
                    <button className={styles.webErrorModalContentHeadCloser} onClick={handleExit}>
                      <CloseX color="inherit" />
                    </button>
                  }
                </div>
                <div className={styles.webErrorModalContentBody}>
                  { getModalBody() }
                  <div className={styles.webErrorModalContentBodyButtonGroup}>
                    <Button onClick={handleRetry}>
                      {intl.formatMessage(messages.buttonTryAgain)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CSSTransition>
        </div>
      </ThemeProvider>
    </Modal>
  );
};

export default WebErrorModal;
