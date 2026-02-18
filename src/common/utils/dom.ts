import { BACK_EVENT, LONG_PRESS_EVENT } from 'common/constants/constants';
import { xboxOneLeftStickMapping } from 'common/constants/key-map';
import ApiClient from 'common/helpers/ApiClient';

type MaybeArray<T> = T | T[];
export type Listener<T extends Event> = (event: T) => void;

export const LISTENERS_MAP_PROP = '_listenersMap';

export type ListenersMap<T extends Event> = {
  [LISTENERS_MAP_PROP]?: Record<string, Listener<T>[]>
};

interface RemoveEventHook<T extends Event> {
  el: EventTarget | undefined;
  type: string;
  cb: (listener: Listener<T>) => void;
}

const removeEventHooks: RemoveEventHook<Event>[] = [];

// register hook for removing event listener method, make it possible to manage retrieved listeners
export function registerRemoveEventHook<T extends Event>(
  el: EventTarget | undefined,
  type: string,
  cb: (listener: Listener<T>,
) => void) {
  removeEventHooks.push({ el, type, cb });

  return {
    unregister: () => {
      for (let i = 0, len = removeEventHooks.length; i < len; i++) {
        const hook = removeEventHooks[i];
        if (hook.el === el && hook.type === type && hook.cb === cb) {
          removeEventHooks.splice(i, 1);
          i--;
          len--;
        }
      }
    },
  };
}

// add listener(s) for specific event type
export function addEventListener<T extends Event>(
  el: EventTarget & ListenersMap<T>| undefined,
  type: MaybeArray<string>,
  handler?: MaybeArray<Listener<T>>,
  options?: boolean | AddEventListenerOptions,
): void {
  if (!handler || !el) return;
  if (Array.isArray(type)) {
    type.forEach((event) => addEventListener(el, event, handler, options));
    return;
  }
  if (Array.isArray(handler)) {
    handler.forEach((listener) => addEventListener(el, type, listener, options));
    return;
  }

  el.addEventListener(type, handler as Listener<Event>, options);

  el[LISTENERS_MAP_PROP] = el[LISTENERS_MAP_PROP] || {};
  el[LISTENERS_MAP_PROP][type] = el[LISTENERS_MAP_PROP][type] || [];
  const list = el[LISTENERS_MAP_PROP][type];
  if (list.indexOf(handler) !== -1) return;
  list.push(handler);
}

// remove additional listeners map prop from event host if possible
export function cleanEventHost<E extends Event>(el?: EventTarget & ListenersMap<E>): void {
  if (!el) return;

  const hasListeners = Object.keys(el[LISTENERS_MAP_PROP] || {})
    .some((type) => !!el[LISTENERS_MAP_PROP]?.[type].length);

  if (!hasListeners) {
    el[LISTENERS_MAP_PROP] = undefined;
    delete el[LISTENERS_MAP_PROP];
  }
}

// remove listener(s) for specific event type
export function removeEventListener(el: EventTarget | undefined, type: string[]): void;
export function removeEventListener<T extends Event>(el: EventTarget | undefined, type: string): Listener<T>[] | void;
export function removeEventListener<T extends Event>(
  el: EventTarget | undefined,
  type: MaybeArray<string>,
  handler: Listener<T>,
): Listener<T> | void;
export function removeEventListener<T extends Event>(
  el: EventTarget | undefined,
  type: MaybeArray<string>,
  handler?: Listener<T>,
  options?: boolean | EventListenerOptions,
): MaybeArray<Listener<T>> | void;
export function removeEventListener<T extends Event>(
  el: EventTarget & ListenersMap<T> | undefined,
  type: MaybeArray<string>,
  handler?: Listener<T>,
  options?: boolean | EventListenerOptions,
): MaybeArray<Listener<T>> | void {
  if (!el) return;
  if (Array.isArray(type)) {
    type.forEach((event) => removeEventListener(el, event, handler, options));
    return;
  }
  if (handler) {
    // pass through remove event hooks
    removeEventHooks.forEach((hook) => {
      if (hook.el === el && hook.type === type) {
        hook.cb(handler as Listener<Event>);
      }
    });
  }
  if (!el[LISTENERS_MAP_PROP] || !el[LISTENERS_MAP_PROP][type]) return;

  const list: Listener<T>[] = el[LISTENERS_MAP_PROP][type];
  if (handler) {
    const index = list.indexOf(handler);
    if (index !== -1) {
      el.removeEventListener(type, handler as Listener<Event>, options);
      const deletedListener = list.splice(index, 1);
      cleanEventHost(el);
      return deletedListener;
    }
  } else {
    list.forEach((listener) => el.removeEventListener(type, listener as Listener<Event>, options));
    el[LISTENERS_MAP_PROP][type] = [];
    cleanEventHost(el);
    return list;
  }
}

// remove all handlers for el & type, insert new handler, then re-attach all handlers
export function prependEventListener<T extends Event>(el: EventTarget | undefined, type: string, handler: Listener<T>, options?: boolean | AddEventListenerOptions): void {
  const originalHandlers = removeEventListener(el, type) || [];
  addEventListener(el, type, [handler].concat(originalHandlers), options);
}

// archive event listeners of an element, to make it possible to respond to only new listeners,
// it returns a handler object with `restore` method to restore the archived listeners
export function archiveAllEventListeners(el: EventTarget | undefined, type: string): { restore: (appendOriginalListeners?: boolean) => void } {
  const originalListeners = removeEventListener(el, type) || [];
  // keep the originalListeners latest when somewhere executes `removeEventListener` to remove some listener
  const removeEventHookHandler = registerRemoveEventHook(el, type, (handler) => {
    const index = originalListeners.indexOf(handler);
    if (index !== -1) {
      originalListeners.splice(index, 1);
    }
  });

  return {
    restore: () => {
      removeEventHookHandler.unregister();
      const listeners = removeEventListener(el, type) || [];

      // keep original listeners at the front
      addEventListener(el, type, ([] as Listener<Event>[]).concat(originalListeners, listeners));
    },
  };
}

/**
 * retrieve some property's computed value of a dom node
 * @param {string|HTMLElement} el
 * @param {property} property
 * @return {string}
 */
export function getComputedValue<E extends HTMLElement, P extends keyof CSSStyleDeclaration>(
  el: E | string,
  property: P,
): string {
  const node = typeof el === 'string' ? document.querySelector(el) : el;
  if (!node) return '';
  return window.getComputedStyle(node).getPropertyValue(`${property}`);
}

// return current fullscreen element
export function getFullscreenElement() {
  // Typecast document as an object that can have additional properties that all
  // resolve to be the HTMLElement type (or something that extends from it).
  // That prevents TS from complaining about these properties it would otherwise
  // think are invalid (and in most environments, it is right).
  const doc = document;
  /* istanbul ignore next */
  return doc.fullscreenElement
    || doc.webkitFullscreenElement
    || doc.mozFullScreenElement
    || doc.msFullscreenElement;
}

// enter fullscreen mode
export function enterFullscreen(el: HTMLElement) {
  /* istanbul ignore next */
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

// exit fullscreen mode
export function exitFullscreen() {
  // See explanatory comment above about this.
  const doc = document as (HTMLDocument & { [key: string]: () => void });
  /* istanbul ignore next */
  if (doc.exitFullscreen) {
    doc.exitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    doc.mozCancelFullScreen();
  } else if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) {
    doc.msExitFullscreen();
  }
}

/**
 * Disable scroll for the document, returning a callback which
 * allows restoring scroll behavior
 *
 * Note that this helper makes no attempt to track whether scroll is disabled;
 * repeated calls will results in the last returns restoration callback
 * failing to restore the original scroll behavior.
 */
export const disableScroll = () => {
  const scrollingElement = document.scrollingElement;
  /* istanbul ignore next */
  if (!(scrollingElement instanceof HTMLElement)) return;

  let oldScrollingElementHeight = '';
  let oldScrollingElementOverflow = '';

  oldScrollingElementHeight = scrollingElement.style.height;
  scrollingElement.style.height = '100%';
  oldScrollingElementOverflow = scrollingElement.style.overflow;
  scrollingElement.style.overflow = 'hidden';

  // ensure we're scolled to the top
  window.scrollTo(0, 0);

  return () => {
    scrollingElement.style.height = oldScrollingElementHeight;
    scrollingElement.style.overflow = oldScrollingElementOverflow;
  };
};

/**
 * Attempt to lock the screen to a certain orientation
 */
export function lockMobileOrientation(orientation: OrientationLockType) {
  const screen = window.screen as (Screen & { [key: string]: (o: OrientationLockType) => void });
  /* istanbul ignore next */
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock(orientation);
  } else if (screen.lockOrientation) {
    screen.lockOrientation(orientation);
  } else if (screen.mozLockOrientation) {
    screen.mozLockOrientation(orientation);
  } else if (screen.msLockOrientation) {
    screen.msLockOrientation(orientation);
  }
}

/**
 * Constructing simulated KeyboardEvent
 */
export function constructKeyboardEvent(
  type: string,
  options: KeyboardEventInit & { keyCode?: number },
): KeyboardEvent {
  const EventConstructor = typeof KeyboardEvent !== 'undefined' ? KeyboardEvent : Event;

  const { bubbles = true, cancelable = true, keyCode, ...rest } = options;
  const newEvent = new EventConstructor(type, { bubbles, cancelable, ...rest });

  // need to assign "keyCode" and "which" because they are legacy event args,
  // but are still used through our app and legacy browsers.
  const descriptor = { configurable: true, enumerable: true, writable: true };
  Object.defineProperties(newEvent, {
    keyCode: { ...descriptor, value: keyCode },
    // fallback to "keyCode" as "which" is equal to "keyCode" usually.
    which: { ...descriptor, value: keyCode },
  });

  return newEvent as KeyboardEvent;
}

/**
 * Dispatching simulated KeyboardEvent
 */
export function dispatchKeyboardEvent(
  target: EventTarget,
  type: string,
  options: KeyboardEventInit & { keyCode?: number, preventDefault?: () => void },
): boolean | void {
  let dispatchEventResult: boolean | undefined;
  if (typeof window !== 'undefined') {
    const newEvent = constructKeyboardEvent(type, options);
    dispatchEventResult = target.dispatchEvent(newEvent);
  }
  return dispatchEventResult;
}

/**
 * Constructing simulated Event for "back"
 */
export function constructBackEvent(options: EventInit = {}): Event {
  const { bubbles = true, cancelable = true } = options;
  const newEvent = new Event(BACK_EVENT, { bubbles, cancelable });

  return newEvent;
}

/**
 * Dispatching simulated Event of "Back"
 */
export function dispatchBackEvent(options: EventInit & { target?: HTMLElement } = {}) {
  if (typeof window === 'undefined') return;

  const newEvent = constructBackEvent();
  const target = options.target || window;
  return target.dispatchEvent(newEvent);
}

/**
 * Constructing simulated Event for "LongPress"
 */
export function constructLongPressEvent(options: EventInit = {}): Event {
  const { bubbles = true, cancelable = true } = options;
  const newEvent = new Event(LONG_PRESS_EVENT, { bubbles, cancelable });

  return newEvent;
}

/**
 * Dispatching simulated Event of "LongPress"
 */
export function dispatchLongPressEvent(event?: KeyboardEvent) {
  if (typeof window === 'undefined') return;

  const newEvent = constructLongPressEvent();
  const target = event?.target || window;
  return target.dispatchEvent(newEvent);
}

/**
 * Constructing custom event
 */
export function constructCustomEvent(eventName: string, options: CustomEventInit = {}): CustomEvent {
  const { bubbles = true, cancelable = true } = options;
  const newEvent = new CustomEvent(eventName, { ...options, bubbles, cancelable });

  return newEvent;
}

/**
 * Dispatching custom event
 */
export function dispatchCustomEvent(eventName: string, options: CustomEventInit & { target?: HTMLElement } = {}) {
  if (typeof window === 'undefined') return;

  const newEvent = constructCustomEvent(eventName, options);
  const target = options.target || window;
  return target.dispatchEvent(newEvent);
}

/*
 * Handle XboxOne Left JoyStick Key Remapping, returns true if well handled
 * @returns {boolean}
 */
export function handleXboxoneLeftStickKeyMapping(e: KeyboardEvent): boolean {
  /* istanbul ignore next */
  if (__OTTPLATFORM__ === 'XBOXONE') {
    /**
     * handling key event mapping on XboxOne device
     * mapping direction on left joystick to gamepad key
     * 🕹 -> ➕
     *
     * when pressing key on joystick
     * window will dispatch a new fake KeyboardEvent
     */
    const mappingKeyCode = xboxOneLeftStickMapping[e.keyCode];
    if (mappingKeyCode) {
      e.preventDefault();

      dispatchKeyboardEvent(window, 'keydown', { keyCode: mappingKeyCode });
      return true;
    }
  }
  return false;
}

// if we cannot hit this route, we are not online
export function checkHealth() {
  const client = new ApiClient();
  return client.get('/oz/health').then(() => {
    return Promise.resolve(true);
  }).catch(() => {
    return Promise.resolve(false);
  });
}

// if we cannot hit this route, we are not online
export function checkHealthForUrl(url: string) {
  const client = new ApiClient();
  return client.get(url).then((data) => {
    return Promise.resolve(data);
  }).catch((err) => {
    return Promise.reject(err);
  });
}

/*
 * load external script
 */
export const loadScript = (url: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.onerror = (_event, _source, _line, _col, error) => {
      reject(error);
    };
    script.onload = () => {
      resolve();
    };
    script.async = true;
    script.src = url;
    document.body.appendChild(script);
  });

/*
 * load inline script
 */
export const appendInlineScript = (html: string) => {
  const script = document.createElement('script');
  script.innerHTML = html;
  document.body.appendChild(script);
};
