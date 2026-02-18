import { ActionLevel, controlActions, type Interceptor, interceptorManager, playerCommander } from '@adrise/player';
import type { Dispatch } from 'react';
const interceptor: Interceptor = {
  name: 'Initial Consent Modal',
  play: /* istanbul ignore next */ () => ActionLevel.NONE,
};
const addInterceptor = () => {
  interceptorManager.addInterceptor(interceptor);
};
const removeInterceptor = () => {
  interceptorManager.removeInterceptor(interceptor);
};

export const pausePlaybackWhenInitialConsentShow = (dispatch: Dispatch<unknown>) => {
  const closed = window.OneTrust.IsAlertBoxClosed();
  if (closed) {
    removeInterceptor();
    dispatch(controlActions.play(ActionLevel.CODE));
    playerCommander.play();
  } else {
    // Pause VOD playback with controlActions and pause live player with playerCommander
    dispatch(controlActions.pause());
    playerCommander.pause();
    // The interceptor is to prevent any playback from interactions, autostart, etc.
    addInterceptor();
  }
};
