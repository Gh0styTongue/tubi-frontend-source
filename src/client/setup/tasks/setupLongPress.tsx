import type { IsPressingTarget } from '@tubitv/ott-ui';
import { PressManager } from '@tubitv/ott-ui';
import last from 'lodash/last';

import { dispatchLongPressEvent } from 'common/utils/dom';
import { getOTTRemote } from 'common/utils/keymap';

import { isLongPressEventEnabled } from '../../utils/isLongPressEventEnabled';

export const setupLongPress = () => {
  let isPressing = false;
  let pressingTarget = '';
  let keydownTimer: ReturnType<typeof setTimeout>;

  function handleLongPress(event: KeyboardEvent) {
    clearTimeout(keydownTimer);
    dispatchLongPressEvent(event);
  }

  if (!isLongPressEventEnabled()) return;

  const enterKey = 'Enter';
  const enterKeyCode = getOTTRemote().enter;
  const isEnterKey = (event: KeyboardEvent) => event.key === enterKey || event.keyCode === enterKeyCode;
  const LONG_PRESS_DELAY = 500; // ms

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (isPressing) {
      // User still can press other keys when hold the Enter key, so we must prevent them.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    if (isEnterKey(event) && PressManager.targets.length > 0) {
      // Prevent the Enter keyboard event and re-dispatch it after released.
      isPressing = true;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // the timeout gets canceled as soon as any 'keyup' event occurs
      keydownTimer = setTimeout(() => handleLongPress(event), LONG_PRESS_DELAY);
      // every component using useIsPressing, will generate a custom target id
      // we can use this target to make sure the current press target does not change
      pressingTarget = last(PressManager.targets) as string; // get the latest target
      PressManager.press();
      const pressingHandler = (isPressingTarget: IsPressingTarget) => {
        if (isPressingTarget.isPressing === true) {
          return;
        }
        PressManager.removePressHandler(pressingHandler);
        setTimeout(() => {
          isPressing = false;
          // when side sheet shows, the target will change.
          // so we need use condition to avoid the first button on side sheet would be called unexpectedly
          if (pressingTarget === last(PressManager.targets)) {
            // Above code we call stopImmediatePropagation and stopPropagation on document
            // So we should dispatch the keydown event for components that are listening for it on `window`
            const newEvent = new KeyboardEvent('keydown', {
              code: enterKey,
              key: enterKey,
            });
            Object.defineProperty(newEvent, 'keyCode', {
              get: () => enterKeyCode,
            });
            window.dispatchEvent(newEvent);
          }
        }, 100); // delay 100
      };
      PressManager.addPressHandler(pressingHandler);
    }
  });

  document.addEventListener('keyup', (event) => {
    clearTimeout(keydownTimer);
    if (isEnterKey(event) && isPressing) {
      PressManager.release();
    }
  });
};
