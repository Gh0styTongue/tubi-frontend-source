import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { CloseStroke } from '@tubitv/icons';
import React, { useCallback, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useIntl } from 'react-intl';

import { setData } from 'client/utils/sessionDataStorage';
import { setAppDownloadModal } from 'common/actions/ui';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { LD_APP_DOWNLOAD_MODAL_DISMISSED } from 'common/constants/constants';
import { DIALOG } from 'common/constants/event-types';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { appDownloadModalVariationSelector } from 'common/selectors/ui';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import Overlay from 'web/components/Overlay/Overlay';

import styles from './AppDownloadModal.scss';
import messages from './messages';

const slideUpClassNames = {
  appear: styles.slideUpEnter,
  appearActive: styles.slideUpEnterActive,
  appearDone: styles.slideUpEnterDone,
  enter: styles.slideUpEnter,
  enterActive: styles.slideUpEnterActive,
  enterDone: styles.slideUpEnterDone,
  exit: styles.slideUpExit,
  exitActive: styles.slideUpExitActive,
  exitDone: styles.slideUpExitDone,
};

export const DEEPLINK = 'https://link.tubi.tv/1EyoA2SmgLb';

const trackModalEvent = (action: DialogAction) => {
  trackEvent(DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'download_full_exp', action));
};

const AppDownloadModal = ({ isShown }: { isShown: boolean }) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const variation = useAppSelector(appDownloadModalVariationSelector);

  // Track SHOW event when modal is displayed
  useEffect(() => {
    if (isShown && variation !== 0) {
      trackModalEvent(DialogAction.SHOW);
    }
  }, [isShown, variation]);

  const close = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setAppDownloadModal(false, variation));
    setData(LD_APP_DOWNLOAD_MODAL_DISMISSED, 'true');
  }, [dispatch, variation]);

  const onCloseButtonClick = useCallback((e: MouseEvent) => {
    close(e);
    trackModalEvent(DialogAction.DISMISS_DELIBERATE);
  }, [close]);

  const onDownloadButtonClick = useCallback((e: MouseEvent) => {
    close(e);
    trackModalEvent(DialogAction.ACCEPT_DELIBERATE);
    window.location.href = DEEPLINK;
  }, [close]);

  if (variation === 0) {
    return null;
  }

  // Select messages based on experiment variation
  const titleMessage = variation === 1 ? messages.title1 : messages.title2;
  const lineMessage = variation === 1 ? messages.lineVar1 : messages.lineVar2;

  return (
    <Overlay isOpen={isShown} contentClassNames={slideUpClassNames}>
      <div className={styles.modal}>
        <div className={styles.closeBtn} onClick={onCloseButtonClick}>
          <CloseStroke />
        </div>
        <div className={styles.content}>
          <div className={styles.logo}><Tubi /></div>
          <div className={styles.title}>{formatMessage(titleMessage)}</div>
          <div className={styles.line}>{formatMessage(lineMessage)}</div>
          <button className={styles.download} onClick={onDownloadButtonClick}>{formatMessage(messages.download)}</button>
        </div>
      </div>
    </Overlay>
  );
};

export default AppDownloadModal;
