import { getData, setData } from 'src/client/utils/sessionDataStorage';

import { IS_COMCAST_DISMISS_LOADING_ANIMATION_CALLED } from './constants';

// dismissLoadingScreen should only called once
let isComcastDismissLoadingAnimationCalled = getData(IS_COMCAST_DISMISS_LOADING_ANIMATION_CALLED);
const setIsComcastDismissLoadingAnimationCalled = (value: string) => {
  setData(IS_COMCAST_DISMISS_LOADING_ANIMATION_CALLED, value);
  isComcastDismissLoadingAnimationCalled = value;
};

// for unit test
export { setIsComcastDismissLoadingAnimationCalled as _setIsComcastDismissLoadingAnimationCalled };

export function dismissComcastLoadingScreen() {
  /* istanbul ignore else */
  if (__IS_COMCAST_PLATFORM_FAMILY__) {
    const dismissLoadingScreen = () => {
      if (isComcastDismissLoadingAnimationCalled === 'true') return;
      // hide the loading screen shown by Comcast
      /* istanbul ignore next */
      window.$badger?.dismissLoadingScreen({ animationLoaded: true });
      setIsComcastDismissLoadingAnimationCalled('true');
    };
    /* istanbul ignore next */
    if (window.$badger?.active()) {
      dismissLoadingScreen();
    } else {
      document.addEventListener('onMoneyBadgerReady', dismissLoadingScreen);
    }
  }
}
