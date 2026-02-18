import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { CloseStroke } from '@tubitv/icons';
import classnames from 'classnames';
import React, { useEffect, useLayoutEffect } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { setAppDownloadBanner } from 'common/actions/ui';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { LD_APP_DOWNLOAD_BANNER_DISMISSED } from 'common/constants/constants';
import { DIALOG } from 'common/constants/event-types';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import styles from './AppDownloadBanner.scss';
import messages from './messages';

interface Props {
  isShown: boolean;
}

export const DEEPLINK = 'https://link.tubi.tv/1EyoA2SmgLb';

const trackBannerEvent = (action: DialogAction) => {
  trackEvent(DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'download_app_banner', action));
};

const AppDownloadBanner = ({ isShown }: Props) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (isShown) {
      trackBannerEvent(DialogAction.SHOW);
    }
  }, [isShown]);

  useLayoutEffect(() => {
    if (!getLocalData(LD_APP_DOWNLOAD_BANNER_DISMISSED)) {
      dispatch(setAppDownloadBanner(true));
    }
  }, [dispatch]);

  const close = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setAppDownloadBanner(false));
    setLocalData(LD_APP_DOWNLOAD_BANNER_DISMISSED, 'true');
  };

  const onLinkClick = (e: MouseEvent) => {
    close(e);
    trackBannerEvent(DialogAction.ACCEPT_DELIBERATE);
    window.location.href = DEEPLINK;
  };

  const onCloseButtonClick = (e: MouseEvent) => {
    close(e);
    trackBannerEvent(DialogAction.DISMISS_DELIBERATE);
  };

  return (
    <div className={classnames(styles.root, { [styles.banner]: isShown })}>
      <div className={styles.logo} onClick={onLinkClick}>
        <Tubi />
      </div>
      <div className={styles.text}>
        {formatMessage(messages.text, {
          b: (chunks: ReactNode) => <b onClick={onLinkClick}>{chunks}</b>,
        })}
      </div>
      <div className={styles.closeBtn} onClick={onCloseButtonClick}>
        <CloseStroke />
      </div>
    </div>
  );
};

export default AppDownloadBanner;
