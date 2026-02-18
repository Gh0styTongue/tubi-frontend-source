import { MEDIA_ERROR_CODES } from '@adrise/player';
import type { AdError } from '@adrise/player';

import type { ErrorClientLogInfo } from './types';
import { UNKNOWN_ERROR } from './types';

export function convertAdErrorIntoErrorClientLog(error: AdError): ErrorClientLogInfo {
  const code = (error.code && (MEDIA_ERROR_CODES[error.code as number] ?? error.code)) ?? UNKNOWN_ERROR;
  const message = error.message ?? UNKNOWN_ERROR;
  return {
    error_code: code as string,
    // We don't want to see so many unknown errors in our data.
    // Let's collect some more information about the error.
    error_message: (message === UNKNOWN_ERROR && message === code) ? JSON.stringify(error) : message,
    fatal: error.fatal ?? true,
  };
}
