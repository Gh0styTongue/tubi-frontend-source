import classNames from 'classnames';
import React, { useEffect } from 'react';

import WebCastingButton from 'common/experiments/config/webCastingButton';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isMobileWebAndroidPlaybackEnabledSelector } from 'common/selectors/experiments/webAndroidPlaybackSelector';
import { mobilePlaybackSupported } from 'common/utils/capabilityDetection';

import styles from './FloatingCastButton.scss';

const FloatingCastButton: React.FunctionComponent = () => {
  const { castReceiverState, castPlayerState } = useAppSelector((state) => state.chromecast);
  const enableWebAndroidPlayback = useAppSelector(isMobileWebAndroidPlaybackEnabledSelector);
  const isMobilePlaybackEnabled = useAppSelector(
    ({ ui: { isMobile, userAgent } }) => isMobile && mobilePlaybackSupported({ userAgent, enableMobileWebIosPlayback: true, enableWebAndroidPlayback })
  );
  const isFullscreen = useAppSelector((state) => state.ui.fullscreen);

  const canCastFromMobileDevice = isMobilePlaybackEnabled && castReceiverState !== 'NO_DEVICES_AVAILABLE';
  const canDisplayFloatingCastButton = !isFullscreen && canCastFromMobileDevice;

  const webCastingButtonExperiment = useExperiment(WebCastingButton);
  useEffect(() => {
    if (canDisplayFloatingCastButton) {
      webCastingButtonExperiment.logExposure();
    }
  }, [canDisplayFloatingCastButton, webCastingButtonExperiment]);

  if (!canDisplayFloatingCastButton || !webCastingButtonExperiment.getValue()) {
    return null;
  }

  return (
    <div
      className={classNames(styles.castButtonArea, {
        [styles.castConnected]: castReceiverState === 'CONNECTED',
        [styles.castIdle]: castPlayerState === 'IDLE',
      })}
    >
      <button
        is="google-cast-button"
        style={{
          '--disconnected-color': 'white',
          '--connected-color': 'white',
          'height': '48px',
          'padding': '12px',
          'border': 'none',
          'background': 'transparent',
        }}
      />
    </div>
  );
};

export default FloatingCastButton;
