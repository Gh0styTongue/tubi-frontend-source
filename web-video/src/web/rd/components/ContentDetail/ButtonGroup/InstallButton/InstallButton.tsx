import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { trackMobileWebDeeplink } from 'client/features/playback/track/client-log/trackMobileWebDeeplink';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import useAppSelector from 'common/hooks/useAppSelector';
import type { Video } from 'common/types/video';
import { getDeepLinkForVideo } from 'common/utils/urlConstruction';

import styles from './InstallButton.scss';

const messages = defineMessages({
  install: {
    description: 'installation button text',
    defaultMessage: 'Watch in App',
  },
});

export interface InstallButtonProps {
  video: Video;
  isInLeftSidebar?: boolean;
}

export const InstallButton: FC<InstallButtonProps> = ({ isInLeftSidebar, video }: InstallButtonProps) => {
  const intl = useIntl();
  const deviceId = useAppSelector(state => state.auth.deviceId);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);

  const handleClick = () => {
    const deeplinkUrl = getDeepLinkForVideo(video, deviceId, {
      stopTracking: !isThirdPartySDKTrackingEnabled,
    });
    trackMobileWebDeeplink({ deeplinkSource: 'InstallButton' as const });
    window.location.href = deeplinkUrl;
  };

  return <Button
    className={styles.mobileInstallButton}
    appearance="tertiary"
    aria-label={intl.formatMessage(messages.install)}
    onClick={handleClick}
  >
    <div className={styles.buttonInner}>
      <i
        className={classNames(styles.appStoreBadge, isInLeftSidebar && styles.hiddenBadge)}
      />
      {intl.formatMessage(messages.install)}
    </div>

  </Button>;
};
