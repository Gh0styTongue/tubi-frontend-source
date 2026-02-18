import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { Close } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import * as eventTypes from 'common/constants/event-types';
import useAppSelector from 'common/hooks/useAppSelector';
import { isAdSelector, playerStateSelector } from 'common/selectors/playerStore';
import type { Video } from 'common/types/video';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { useIsModalDismissed } from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/hooks/useIsModalDismissed';
import { usePauseQrCode } from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/hooks/usePauseQrCode';
import { useTimer } from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/hooks/useTimer';

import styles from './PauseQrCode.scss';

const DIALOG_EVENT_SUBTYPE = 'download_app_banner';

// only show QR code in pauses over this duration
// this value is not experimentally derived
// it is possible that it is too short to prevent the issue it
// was implemented to prevent. see notes on its usage
export const QR_CODE_DISPLAY_DELAY_MS = 300;

export interface PauseQrCodeProps {
  autoplayVisible: boolean;
  video: Video
}

const messages = defineMessages({
  modalTitle: {
    description: 'Pause QR Code Modal Title Text',
    defaultMessage: 'Watch Everywhere',
  },
  modalDescription: {
    description: 'Pause QR Code Modal Description',
    defaultMessage: 'Scan the QR code to download the mobile app and take Tubi on the go',
  },
});

const PauseQrCode = ({ autoplayVisible, video }: PauseQrCodeProps) => {
  const intl = useIntl();
  const playerState = useAppSelector(playerStateSelector);
  const isAd = useAppSelector(isAdSelector);

  /**
   * Modal closure is persisted to local storage
   */
  const { isDismissed, dismissModal } = useIsModalDismissed();

  /**
   * When true, we should attempt to generate a QR code (if we don't yet
   * have one) and open the modal once we have one
   */
  const isPauseEligible = useMemo(() => !isDismissed && playerState === 'paused' && !isAd && !autoplayVisible, [
    isDismissed,
    playerState,
    isAd,
    autoplayVisible,
  ]);

  /**
   * When in the first eligible pause state, attempt to generate a QR code
   * Only does the generation once per playback session, caching the data URL
   */
  const { qrCodeDataUrl } = usePauseQrCode({ isPauseEligible, video });

  /**
   * This timer helps ensure that we don't show the QR code right at the
   * start of a pause. We need this because of edge cases in which the
   * QR code can appear during very short pauses in the transition from
   * content to ads in which the player is paused even though content type
   * has not yet tranditioned to ads.
   *
   * Because the edge case in question is a race, it is quite possible
   * that the timer does not actually prevent it. Thus, we need to
   * revisit.
   *
   * TODO: we need to find and solve the underlying cause of us being able
   * to get into a paused state before the content type has changed to ads
   * during the transition to ads. (Reproducing this is tricky; see
   * https://app.shortcut.com/tubi/story/784529/desktop-web-mobile-download-qr-code-on-pause-screen#activity-829785
   * for proof that it is possible)
   */
  const { timerDone } = useTimer({ duration: QR_CODE_DISPLAY_DELAY_MS, runTimer: !!qrCodeDataUrl && isPauseEligible });

  /**
    * Only open the modal once:
    * 1. we meet the right conditions in a pause,
    * 2. QR code generation is done,
    * 3. our timer has run down
   */
  const { overlayClassNames, testId, openModal } = useMemo(() => {
    const openModal = timerDone && !!qrCodeDataUrl && isPauseEligible;
    const overlayClassNames = classNames([
      styles.pauseQrCodeOverlay,
      {
        [styles.open]: openModal,
      },
    ]);

    // makes testing easier
    const testId = openModal ? 'pause-qr-code-open' : 'pause-qr-code-closed';
    return { overlayClassNames, testId, openModal };
  }, [timerDone, isPauseEligible, qrCodeDataUrl]);

  /**
   * Analytics event when the modal is opened
   */
  useEffect(() => {
    if (openModal) {
      trackEvent(eventTypes.DIALOG, buildDialogEvent(
        getCurrentPathname(),
        DialogType.INFORMATION,
        DIALOG_EVENT_SUBTYPE,
        DialogAction.SHOW
      ));
    }
  }, [openModal]);

  /**
   * Once closed, there is no way to reopen the QR code modal
   */
  const handleClose = useCallback((e: React.MouseEvent) => {
    // ensure clicking does not trigger anything in the player
    e.stopPropagation();

    /**
     * Analytics event for modal dismissal
     */
    trackEvent(eventTypes.DIALOG, buildDialogEvent(
      getCurrentPathname(),
      DialogType.INFORMATION,
      DIALOG_EVENT_SUBTYPE,
      DialogAction.DISMISS_DELIBERATE
    ));
    dismissModal();
  }, [dismissModal]);

  /**
     * Helps us ensure that clicking on the background of the modal
     * does not trigger any behavior on the part of the parent component
     */
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className={overlayClassNames} data-test-id={testId} onClick={stopPropagation}>
      <Close onClick={handleClose} data-test-id="pause-qr-code-close-button" />
      <div
        className={styles.qrCodeContainer}
        style={{
          // To get the black part of the QR code to appear as a transparent hole
          // that lets the gradient background show through the white square, we
          // use the CSS image masking feature. This is done by setting the style
          // prop here to a PNG that has an alpha channel set. Note that
          // mask-image is not supported on some older browsers and must be prefixed
          maskImage: `url('${qrCodeDataUrl}')`,
          WebkitMaskImage: `url('${qrCodeDataUrl}')`,
        }}
      />
      <div className={styles.textContainer}>
        <h2 className={styles.title}>{intl.formatMessage(messages.modalTitle)}</h2>
        <span className={styles.description}>{intl.formatMessage(messages.modalDescription)}</span>
      </div>
    </div>
  );
};

export default PauseQrCode;
