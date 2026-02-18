import type { trackEvent as typeTrackEvent, trackLogging as typeTrackLogging } from '../track';

let depTrackEvent: undefined | typeof typeTrackEvent;
let depTrackLogging: undefined | typeof typeTrackLogging;

export function getTrackEvent(): undefined | typeof typeTrackEvent {
  return depTrackEvent;
}

export function setTrackEvent(cb: typeof typeTrackEvent | undefined): void {
  depTrackEvent = cb;
}

export function getTrackLogging(): undefined | typeof typeTrackLogging {
  return depTrackLogging;
}

export function setTrackLogging(cb: typeof typeTrackLogging | undefined): void {
  depTrackLogging = cb;
}

export function trackEvent(arg1: Parameters<typeof typeTrackEvent>[0], arg2: Parameters<typeof typeTrackEvent>[1]): ReturnType<typeof typeTrackEvent> {
  if (depTrackEvent === undefined) {
    throw new Error('dependency trackEvent not injected');
  }
  return depTrackEvent(arg1, arg2);
}

export function trackLogging(arg1: Parameters<typeof typeTrackLogging>[0]): ReturnType<typeof typeTrackLogging> {
  if (depTrackLogging === undefined) {
    throw new Error('dependency trackLogging not injected');
  }
  return depTrackLogging(arg1);
}

