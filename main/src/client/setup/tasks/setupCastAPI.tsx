import { CAST_APPLICATION_ID } from 'common/constants/constants';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { removeFixedBanner } from 'web/features/fixedBanner/actions/fixedBanner';

type GetState = () => StoreState;

// initialize global fn for chromecast SDK, must be defined before loading SDK library in Html.js
export const setupCastAPI = (dispatch: TubiThunkDispatch, getState: GetState) => {
  /* istanbul ignore next */
  window.__onGCastApiAvailable = function onGCastApiAvailable(isAvailable) {
    // note- Brave browser does not have chromecast but `isAvailable` is true. validate cast and chrome.cast here too
    const castIsAvailable = !!(isAvailable && window.chrome && window.chrome.cast && window.cast);
    (window as Window).castApiAvailable = castIsAvailable;

    if (castIsAvailable) {
      const castContext = cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: CAST_APPLICATION_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // listen for cast session state changes
      castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event) => {
        switch (event.sessionState) {
          case cast.framework.SessionState.SESSION_STARTED:
            // remove fixed banner so it doesn't overlap with cast controls
            if (getState().fixedBanner.bannerState) {
              dispatch(removeFixedBanner());
            }
            break;
          default:
            break;
        }
      });
      document.dispatchEvent(new Event('chromecastApiReady'));
    }
  };
};
