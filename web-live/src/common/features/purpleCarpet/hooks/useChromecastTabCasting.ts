import { useEffect } from 'react';

import * as actions from 'common/constants/action-types';
import { CAST_APPLICATION_ID } from 'common/constants/constants';
import useAppDispatch from 'common/hooks/useAppDispatch';
import { actionWrapper } from 'common/utils/action';
import { getDebugLog } from 'common/utils/debug';

const debugLog = getDebugLog('ChromecastTabCasting');

function endCurrentCasting() {
  if ((window as Window).castApiAvailable !== true) return;
  // note- Brave browser does not have chromecast but `isAvailable` is true. validate cast and chrome.cast here too
  const castIsAvailable = window.chrome && window.chrome.cast && window.cast;

  if (!castIsAvailable) return;
  cast.framework.CastContext.getInstance().getCurrentSession()?.endSession(true);
  debugLog('end current casting');
}

function setCastOption(receiverApplicationId = CAST_APPLICATION_ID) {
  if ((window as Window).castApiAvailable !== true) return;
  // note- Brave browser does not have chromecast but `isAvailable` is true. validate cast and chrome.cast here too
  const castIsAvailable = window.chrome && window.chrome.cast && window.cast;

  if (!castIsAvailable) return;
  const castContext = cast.framework.CastContext.getInstance();
  castContext.setOptions({
    receiverApplicationId,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });
  debugLog('set cast option', receiverApplicationId);
}

export const useChromecastTabCasting = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const forceTabCasting = () => {
      dispatch(actionWrapper(actions.SET_CAST_CONTENT_ID, { contentId: undefined }));
      endCurrentCasting();
      /**
       * Any casting behavior will use the app casting but not tab casting since we have installed the sender API and provided them with our app ID.
       * I implemented this in a hacky way.
       * I will reset our casting ID with an invalid value, none.
       * The Chrome browser cannot find our app, so it has to fall back to tab casting.
       */
      setCastOption('none');
    };
    forceTabCasting();
    document.addEventListener('chromecastApiReady', forceTabCasting);
    return () => {
      document.removeEventListener('chromecastApiReady', forceTabCasting);
      setCastOption();
    };
  }, [dispatch]);
};
