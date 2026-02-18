import type { ErrorEventData } from '@adrise/player';

export function isFatalError(error: ErrorEventData) {
  return !!error.fatal || (typeof MediaError !== 'undefined' && error instanceof MediaError);
}
