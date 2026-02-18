import values from 'lodash/values';

import type {
  Hotkeys,
  KeyMap } from 'common/constants/key-map';
import {
  netgemRemote,
  baseHotkeys,
  baseKeyCode,
  comcastRemote,
  devRemote,
  fireRemote,
  hisenseRemote,
  lgtvRemote,
  ps4Remote,
  ps5Hotkeys,
  ps5Remote,
  psHotkeys,
  sonyRemote,
  tivoRemote,
  tizenRemote,
  verizontvRemote,
  vizioRemote,
  xboxOneHotKeys,
  xboxOneRemote,
} from 'common/constants/key-map';
import { PLATFORMS } from 'common/constants/platforms';
import type { LeaveDirection } from 'common/types/directions';
import { getPlatform } from 'common/utils/platform';

export const getOTTRemote = (): KeyMap => {
  if (__DEVELOPMENT__ && typeof Windows !== 'undefined' && __OTTPLATFORM__ === 'XBOXONE') return xboxOneRemote;
  if (__DEVELOPMENT__ && !__IS_NGROK_DEV__) return devRemote;
  if (__STAGING__) {
    const Cookie = require('react-cookie').default;
    const KEYMAP_COOKIE_NAME = 'ENABLE_DEVREMOTE';
    const isDevRemoteEnabled = Cookie.load(KEYMAP_COOKIE_NAME);
    if (isDevRemoteEnabled) {
      return devRemote;
    }
  }

  const platform = getPlatform();

  switch (platform) {
    case PLATFORMS.androidtv:
    case PLATFORMS.firetv_hyb:
    case PLATFORMS.hilton:
    case PLATFORMS.directvhosp:
    case PLATFORMS.bridgewater:
      return fireRemote;
    case PLATFORMS.comcast:
    case PLATFORMS.comcasthosp:
    case PLATFORMS.shaw:
    case PLATFORMS.rogers:
    case PLATFORMS.cox:
      return comcastRemote;
    case PLATFORMS.sony:
      return sonyRemote;
    case PLATFORMS.ps4:
      return ps4Remote;
    case PLATFORMS.ps5:
      return ps5Remote;
    case PLATFORMS.tivo:
      return tivoRemote;
    case PLATFORMS.tizen:
      return tizenRemote;
    case PLATFORMS.verizontv:
      return verizontvRemote;
    case PLATFORMS.vizio:
      return vizioRemote;
    case PLATFORMS.netgem:
      return netgemRemote;
    case PLATFORMS.xboxone:
      /* istanbul ignore next */
      if ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && typeof Windows === 'undefined') {
        return devRemote;
      }
      return xboxOneRemote;
    case PLATFORMS.hisense:
      return hisenseRemote;
    // THIS WILL NEED TO BE UPDATE PENDING ON BACKEND DECISION TO USE LG OR LGTV
    case PLATFORMS.lgtv:
    case 'lg' as any:
      return lgtvRemote;
    default:
      return baseKeyCode;
  }
};

export const getOTTHotkeys = (): Hotkeys => {
  const platform = getPlatform();

  switch (platform) {
    case PLATFORMS.ps4:
      return psHotkeys;
    case PLATFORMS.ps5:
      return ps5Hotkeys;
    case PLATFORMS.xboxone:
      return xboxOneHotKeys;
    default:
      return baseHotkeys;
  }
};

/**
 * memoized function, will return true if keyCode is a part of the OTT buttons/hotkeys excluding the back button.
 */
const OTTSpecialKeys: Record<number, boolean> = {};

let KEYMAPS: { [key: string]: number | undefined }[] = [];

const getKeymaps = () => {
  /* istanbul ignore next */
  if (!KEYMAPS.length) {
    KEYMAPS = [getOTTRemote(), ...values(getOTTHotkeys())];
  }
  return KEYMAPS;
};

export const isOTTKeys = (keyCode: number): boolean => {
  // check remote keys and all hotkey contexts
  if (!Object.keys(OTTSpecialKeys).length) {
    getKeymaps().forEach((keyMap) => {
      for (const key in keyMap) {
        if (keyMap.hasOwnProperty(key) && key !== 'back' && typeof keyMap[key] === 'number') {
          OTTSpecialKeys[keyMap[key] as number] = true;
        }
      }
    });
  }
  return !!OTTSpecialKeys[keyCode];
};

export const isArrowKey = (code: number): boolean => {
  const REMOTE = getOTTRemote();
  const arrow = [REMOTE.arrowUp, REMOTE.arrowDown, REMOTE.arrowLeft, REMOTE.arrowRight];
  return arrow.indexOf(code) >= 0;
};

export interface HandleGridArrowKeyEventParams {
  activeIndex: number; // current active index
  contentLength: number; // item length
  keyCode: number;
  onChangeHandler: (nextIndex: number) => void;
  onLeaveHandler?: (keyCode: number) => void;
  tilesPerRow: number;
  leaveDirections?: LeaveDirection[];
}

/**
 * Handle navigation with OTT remote in a content grid that takes up the right side of
 * the screen. The onLeaveHandler option is invoked when the cursor would exit the
 * left hand side of the grid.
 */
export const handleGridArrowKeyEvent = ({
  activeIndex,
  contentLength,
  keyCode,
  onChangeHandler,
  onLeaveHandler,
  tilesPerRow,
  leaveDirections = ['LEFT'],
}: HandleGridArrowKeyEventParams): void => {
  const REMOTE = getOTTRemote();
  if (!isOTTKeys(keyCode)) return;

  const maxIndex = contentLength - 1;
  const isLeftEdge = activeIndex % tilesPerRow === 0;
  const isRightEdge = activeIndex === maxIndex || (activeIndex + 1) % tilesPerRow === 0;
  const isUpEdge = activeIndex < tilesPerRow;
  const isDownEdge = activeIndex + tilesPerRow > maxIndex;

  let nextIndex = activeIndex;
  let isLeaving = false;
  switch (keyCode) {
    // if direction=remote and edge
    case REMOTE.arrowLeft:
      if (isLeftEdge) {
        isLeaving = leaveDirections.includes('LEFT');
      } else {
        nextIndex = activeIndex - 1;
      }
      break;
    case REMOTE.arrowRight:
      if (isRightEdge) {
        isLeaving = leaveDirections.includes('RIGHT');
      } else {
        nextIndex = activeIndex + 1;
      }
      break;
    case REMOTE.arrowUp:
      if (isUpEdge) {
        isLeaving = leaveDirections.includes('UP');
      } else {
        nextIndex = activeIndex - tilesPerRow;
      }
      break;
    case REMOTE.arrowDown:
      if (isDownEdge) {
        isLeaving = leaveDirections.includes('DOWN');
      } else {
        nextIndex = Math.min(activeIndex + tilesPerRow, maxIndex);
      }
      break;
    default:
      // return here so that any event not handled by this function will not call "onChange"
      return;
  }

  if (isLeaving) {
    onLeaveHandler?.(keyCode);
    return;
  }

  if (activeIndex !== nextIndex) {
    onChangeHandler(nextIndex);
  }
};
