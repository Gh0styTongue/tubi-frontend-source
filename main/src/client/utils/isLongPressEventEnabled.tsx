import { IS_LONG_PRESS_EVENT_ENABLED } from 'common/constants/constants';
import { isSamsungBefore2017 } from 'common/utils/tizenTools';

// For Tizen platform we only enable button animation for model newer than 2016.
// There are some compatibility issue in model 2015 and 2016, their web engine is different from others.
export function isLongPressEventEnabled() {
  if (__OTTPLATFORM__ === 'TIZEN') {
    if (__DEVELOPMENT__) {
      // if systemApi returns 15 or 16 set to false
      if (isSamsungBefore2017()) {
        return false;
      }
      // allow for developers not on actual device
      return true;
    }
    return !isSamsungBefore2017();
  }
  return IS_LONG_PRESS_EVENT_ENABLED;
}
