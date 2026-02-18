import { isNewTivoOSVersion } from 'client/systemApi/utils';

export type KeyMap = {
  arrowLeft: number;
  arrowUp: number;
  arrowRight: number;
  arrowDown: number;
  back?: number;
  enter: number;
  forward: number;
  pause?: number;
  play?: number;
  playPause?: number;
  rewind: number;
  stop?: number;
  subtitle?: number;
  exit?: number;
  leftShoulder?: number;
  rightShoulder?: number;
  next?: number;
  previous?: number;
};

export const baseKeyCode: KeyMap = {
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
  enter: 13,
  playPause: 179,
  forward: 228,
  rewind: 227,
};

// mapping our keyboard to simulate OTT Remote keyCodes and over-write key-mapping in dev
export const devRemote: KeyMap = {
  ...baseKeyCode,
  playPause: 83, // S
  forward: 68, // D
  rewind: 65, // A
  back: 8, // delete/back-space
  pause: 80, // P
  subtitle: 67, // C
  stop: 27, // ESC
  play: 69, // E
  leftShoulder: 219, // [
  rightShoulder: 221, // ]
};

export const fireRemote: KeyMap = {
  ...baseKeyCode,
  back: 27,
};

export const comcastRemote: KeyMap = {
  ...baseKeyCode,
  back: 8, // named 'last' in comcast docs and comcast physical remote
};

export const netgemRemote: KeyMap = {
  ...baseKeyCode,
  back: 27,
};

export const verizontvRemote: KeyMap = {
  ...baseKeyCode,
  back: 46,
};

let sonyVKs: Partial<KeyMap> = {};
let tivoVKs: Partial<KeyMap> = {};

declare global {
  interface Window {
    VK_LEFT: number;
    VK_RIGHT: number;
    VK_UP: number;
    VK_DOWN: number;
    VK_ENTER: number;
    VK_PLAY: number;
    VK_PAUSE: number;
    VK_FAST_FWD: number;
    VK_REWIND: number;
    VK_STOP: number;
    VK_BACK_SPACE: number;
    VK_SUBTITLE: number;
    KeyboardEvent: KeyboardEvent;
  }

  interface KeyboardEvent {
    DOM_VK_LEFT: number;
    DOM_VK_RIGHT: number;
    DOM_VK_UP: number;
    DOM_VK_DOWN: number;
    DOM_VK_ENTER: number;
    DOM_VK_PLAY: number;
    DOM_VK_PLAY_PAUSE: number;
    DOM_VK_FAST_FWD: number;
    DOM_VK_REWIND: number;
    DOM_VK_STOP: number;
    DOM_VK_ESCAPE: number;
    DOM_VK_BACK: number;
  }
}

if (__CLIENT__) {
  // based on https://maqentaer.com/devopera-static-backup/http/dev.opera.com/articles/view/functional-key-handling-in-opera-tv-store-applications/index.html
  sonyVKs = {
    arrowLeft: window.VK_LEFT,
    arrowRight: window.VK_RIGHT,
    arrowUp: window.VK_UP,
    arrowDown: window.VK_DOWN,
    enter: window.VK_ENTER,
    play: window.VK_PLAY,
    pause: window.VK_PAUSE, // sony has a dedicated pause button
    forward: window.VK_FAST_FWD,
    rewind: window.VK_REWIND,
    stop: window.VK_STOP,
    back: window.VK_BACK_SPACE,
    subtitle: window.VK_SUBTITLE,
  };

  tivoVKs = {
    arrowLeft: window.KeyboardEvent.DOM_VK_LEFT,
    arrowRight: window.KeyboardEvent.DOM_VK_RIGHT,
    arrowUp: window.KeyboardEvent.DOM_VK_UP,
    arrowDown: window.KeyboardEvent.DOM_VK_DOWN,
    enter: window.KeyboardEvent.DOM_VK_ENTER,
    play: window.KeyboardEvent.DOM_VK_PLAY,
    playPause: window.KeyboardEvent.DOM_VK_PLAY_PAUSE,
    forward: window.KeyboardEvent.DOM_VK_FAST_FWD,
    rewind: window.KeyboardEvent.DOM_VK_REWIND,
    stop: window.KeyboardEvent.DOM_VK_STOP,
    // new version of TIVO OS will not populate the window.tivo object
    back: isNewTivoOSVersion() ? window.KeyboardEvent.DOM_VK_BACK : window.KeyboardEvent.DOM_VK_ESCAPE,
  };
}

function isComplete(map: any): map is KeyMap {
  return typeof map === 'object' && typeof map.arrowLeft !== 'undefined';
}

const getRemote = (vks: Partial<KeyMap> | KeyMap, base: KeyMap): KeyMap => {
  if (!__CLIENT__) return base;
  if (!isComplete(vks)) return base;

  return vks;
};

export const sonyRemote = getRemote(sonyVKs, baseKeyCode);
export const tivoRemote = getRemote(tivoVKs, baseKeyCode);

export const tizenRemote: KeyMap = {
  ...baseKeyCode,
  playPause: 10252,
  forward: 417,
  rewind: 412,
  play: 415,
  pause: 19,
  stop: 413,
  back: 10009,
};

// PS Constants as it is unique controller
export const PS_TRIANGLE = 112;
export const PS_SQUARE = 32;
export const PS_CIRCLE = 8;
export const PS_X = 13;
const PS_L1 = 116;
const PS_R1 = 117;
const PS_L2 = 118;
const PS_R2 = 119;

const PS5_CIRCLE = 27;
const PS5_SQUARE = 113;

export const ps4Remote: KeyMap = {
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
  enter: PS_X,
  back: PS_CIRCLE,
  forward: PS_R2,
  rewind: PS_L2,
  next: PS_R1,
  previous: PS_L1,
};

export const webKeys = {
  f: 70,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  space: 32,
  c: 67,
  escape: 27,
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
  enter: 13,
  tab: 9,
};

// HOTKEYS used in different contexts to provide shortcuts for all remotes/controllers
export interface Hotkeys {
  keyboard: Partial<{
    space: number;
    delete: number;
    right: number;
    left: number;
  }>;
  playback: Partial<{
    playPause: number;
    stepBackward: number;
    stepForward: number;
  }>;
  contentRow: Partial<{
    pageForward: number;
    pageBackward: number;
    pageForwardAlt: number;
    pageBackwardAlt: number;
  }>;
  global: Partial<{
    search: number;
  }>;
}

export const baseHotkeys: Hotkeys = {
  keyboard: {},
  playback: {},
  contentRow: {},
  global: {},
};

export const psHotkeys: Hotkeys = {
  ...baseHotkeys,
  keyboard: {
    space: PS_TRIANGLE,
    delete: PS_SQUARE,
    right: PS_R1,
    left: PS_L1,
  },
  playback: {
    playPause: PS_X,
  },
  contentRow: {
    pageForward: PS_R1,
    pageBackward: PS_L1,
    pageForwardAlt: PS_R2,
    pageBackwardAlt: PS_L2,
  },
  global: {
    search: PS_TRIANGLE,
  },
};

/**
 * XboxOne Keyboard
 * https://docs.microsoft.com/en-us/windows/uwp/xbox-apps/uwp-remoteinput-api
 */
export const xboxOneRemote: KeyMap = {
  arrowDown: 204,
  arrowLeft: 205,
  arrowRight: 206,
  arrowUp: 203,
  back: 196,
  enter: 195,
  forward: 202,
  next: 199,
  previous: 200,
  rewind: 201,
  leftShoulder: 200,
  rightShoulder: 199,
};

export const xboxOneHotKeys: Hotkeys = {
  ...baseHotkeys,
  global: {
    search: 198,
  },
  playback: {
    playPause: 195,
  },
};

/**
 * XboxOne key code mapping
 * depending on we are supporting both "left stick" and "directional pad" on XboxOne
 * mapping key code of "left stick" to "directional pad"
 */
export const xboxOneLeftStickMapping: Record<number, number> = {
  211: xboxOneRemote.arrowUp,
  212: xboxOneRemote.arrowDown,
  213: xboxOneRemote.arrowRight,
  214: xboxOneRemote.arrowLeft,
};

export const vizioRemote: KeyMap = {
  ...baseKeyCode,
  play: 415,
  forward: 417,
  rewind: 412,
  next: 418,
  previous: 419,
  stop: 413,
  pause: 19,
  back: 8,
  exit: 27,
};

export const hisenseRemote: KeyMap = {
  ...baseKeyCode,
  back: 8,
  play: 415,
  pause: 19,
  stop: 413,
  forward: 417,
  rewind: 412,
  playPause: 463,
};

export const ps5Remote: KeyMap = {
  ...baseKeyCode,
  arrowLeft: 37,
  arrowUp: 38,
  arrowRight: 39,
  arrowDown: 40,
  enter: PS_X,
  back: PS5_CIRCLE,
  /* these are only present on Media Remotes. PS5 requires compatibility with these
  other keys on media remote line up with PS5 controller */
  stop: 178,
  play: 179,
  playPause: 217,
  pause: 135,
  forward: 134,
  rewind: 133,
  subtitle: 139,
};

export const ps5Hotkeys: Hotkeys = {
  ...baseHotkeys,
  keyboard: {
    space: PS_TRIANGLE,
    delete: PS5_SQUARE,
    right: PS_R1,
    left: PS_L1,
  },
  playback: {
    playPause: PS_X,
    // todo @tim
    /*
     * If a player incorporates a fixed-interval Skip function, (of, for example, +/- 10 seconds):
     *   - Skip should be triggered by a single press of the D-Pad or a single tap of the left joystick.
     *   - Scrub should be triggered by additional D-Pad presses, D-Pad press-and-hold, or additional
     * taps of the left joystick/left-joystick hold.
     */
    stepForward: ps5Remote.arrowRight,
    stepBackward: ps5Remote.arrowLeft,
  },
  contentRow: {
    pageForward: PS_R1,
    pageBackward: PS_L1,
    pageForwardAlt: PS_R2,
    pageBackwardAlt: PS_L2,
  },
  global: {
    search: PS_TRIANGLE,
  },
};

export const lgtvRemote: KeyMap = {
  ...baseKeyCode,
  stop: 413,
  play: 415,
  pause: 19,
  rewind: 412,
  forward: 417,
  back: 461,
};

export const KEYBOARD = {
  enter: 13,
  tab: 9,
};
