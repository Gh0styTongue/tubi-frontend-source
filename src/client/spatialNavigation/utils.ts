// TODO: Move these to a different location outside the spatialNavigation folder

import { StringMap } from 'common/utils/collections';
import { getOTTRemote } from 'common/utils/keymap';

import type { EventType, SpatialNavKeyboardEvent } from './types';

export const isWindowDefined = () => typeof window !== 'undefined';
export const isSupported = (property: keyof typeof window) => isWindowDefined() && property in window;

// Generic event listener functions that work with different targets
export function addTargetEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): void;
export function addTargetEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): void;
export function addTargetEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): void;
export function addTargetEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void;
export function addTargetEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options);
}

export function removeTargetEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => unknown,
  options?: boolean | EventListenerOptions
): void;
export function removeTargetEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => unknown,
  options?: boolean | EventListenerOptions
): void;
export function removeTargetEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown,
  options?: boolean | EventListenerOptions
): void;
export function removeTargetEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void;
export function removeTargetEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void {
  target.removeEventListener(type, listener, options);
}

export function addEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): void;
export function addEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void;
export function addEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void {
  if (isWindowDefined()) {
    addTargetEventListener(window, type, listener, options);
  }
}

export function removeEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => unknown,
  options?: boolean | EventListenerOptions
): void;
export function removeEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void;
export function removeEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
): void {
  if (isWindowDefined()) {
    removeTargetEventListener(window, type, listener, options);
  }
}

export function dispatchEvent(event: Event) {
  if (isWindowDefined()) window.dispatchEvent(event);
}

export function safeRequestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): ReturnType<typeof requestIdleCallback> | ReturnType<typeof setTimeout> | ReturnType<typeof safeRequestAnimationFrame> {
  if (!isWindowDefined()) {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      });
    }, 0);
  }

  if (isSupported('requestIdleCallback')) {
    return window.requestIdleCallback(callback, options);
  }

  const start = Date.now();
  const timeout = options?.timeout ?? 50;
  return safeRequestAnimationFrame(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, timeout - (Date.now() - start)),
    });
  });
}

export function safeCancelIdleCallback(handle: ReturnType<typeof safeRequestIdleCallback>): void {
  if (isSupported('requestIdleCallback')) {
    window.cancelIdleCallback(handle as number);
  } else {
    safeCancelAnimationFrame(handle);
  }
}

export function safeRequestAnimationFrame(callback: FrameRequestCallback): ReturnType<typeof setTimeout> | ReturnType<typeof requestAnimationFrame> {
  if (!isWindowDefined()) {
    return setTimeout(() => {
      callback(Date.now());
    }, 16);
  }

  if (isSupported('requestAnimationFrame')) {
    return window.requestAnimationFrame(callback);
  }

  return setTimeout(() => {
    callback(Date.now());
  }, 16);
}

export function safeCancelAnimationFrame(handle: ReturnType<typeof safeRequestAnimationFrame>): void {
  if (isSupported('cancelAnimationFrame')) {
    window.cancelAnimationFrame(handle as number);
  } else {
    clearTimeout(handle);
  }
}

export function requestIdleCallbackAsync(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions & { signal?: AbortSignal }
): Promise<void> {
  const signal = options?.signal;
  if (signal?.aborted) {
    throw new Error('[requestIdleCallbackAsync] Aborted');
  }

  return new Promise<void>((resolve, reject) => {
    const handle = safeRequestIdleCallback((deadline) => {
      if (signal?.aborted) {
        reject(new Error('[requestIdleCallbackAsync] Aborted'));
      } else {
        callback(deadline);
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    }, options);

    const onAbort = () => {
      safeCancelIdleCallback(handle);
      reject(new Error('[requestIdleCallbackAsync] Aborted'));
    };

    signal?.addEventListener('abort', onAbort);
  });
}

export function requestAnimationFrameAsync(
  callback: FrameRequestCallback,
  options?: { signal?: AbortSignal }
): Promise<void> {
  if (options?.signal?.aborted) {
    throw new Error('[requestAnimationFrameAsync] Aborted');
  }

  return new Promise<void>((resolve, reject) => {
    const handle = safeRequestAnimationFrame((time) => {
      if (options?.signal?.aborted) {
        reject(new Error('[requestAnimationFrameAsync] Aborted'));
      } else {
        callback(time);
        options?.signal?.removeEventListener('abort', onAbort);
        resolve();
      }
    });

    const onAbort = () => {
      safeCancelAnimationFrame(handle);
      reject(new Error('[requestAnimationFrameAsync] Aborted'));
    };

    options?.signal?.addEventListener('abort', onAbort);
  });
}

export function wait(
  duration: number,
  options?: {
    signal?: AbortSignal;
    throwOnAbort?: boolean
  },
): Promise<void> {
  const signal = options?.signal;
  const throwOnAbort = options?.throwOnAbort ?? true;
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, duration);

    const onAbort = () => {
      clearTimeout(timeout);
      if (throwOnAbort) reject(new Error('[wait] Aborted'));
      else resolve();
    };

    if (signal?.aborted) {
      onAbort();
    } else {
      signal?.addEventListener('abort', onAbort);
    }
  });
}

export const REMOTE = getOTTRemote();
export const keyCodeToEventTypeMap = new StringMap<EventType>(
  Object.entries(REMOTE).map(([key, value]) => [String(value), key as EventType])
);

export function getKeyboardEvent(type: 'keydown' | 'keyup', keyCode: number = 0): Event & { keyCode: number } {
  if (typeof KeyboardEvent === 'function') {
    return new KeyboardEvent(type, { keyCode });
  }
  // for at least Tizen 2016 the KeyboardEvent is not a constructor
  // function that we can call. When we don't have the native constructor
  // returns an Event that has the keyCode property.
  const result = new Event(type) as Event & { keyCode: number};
  result.keyCode = keyCode;
  return result;
}

export function dispatchSpatialNavKeyboardEvent(type: 'keydown' | 'keyup', key: EventType, isSpatialNavKeyboardEvent = false) {
  const keyCode = REMOTE[key];
  const event = getKeyboardEvent(type, keyCode);
  (event as SpatialNavKeyboardEvent).isSpatialNavKeyboardEvent = isSpatialNavKeyboardEvent;
  dispatchEvent(event);
}

export function isSpatialNavKeyboardEvent(event: KeyboardEvent) {
  return Boolean((event as SpatialNavKeyboardEvent).isSpatialNavKeyboardEvent);
}
