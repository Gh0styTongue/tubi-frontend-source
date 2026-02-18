import { MEDIA_ERROR_CODES } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { trimQueryString } from '@adrise/utils/lib/url';

import { UNKNOWN_ERROR } from 'common/types/playback';
import { convertErrorToUnifiedEnum } from 'common/utils/convertErrorToUnifiedEnum';
import { isFatalError } from 'common/utils/error';

import type { ErrorClientLogInfo } from './types';

export function convertErrorEventDataIntoErrorClientLog(error: ErrorEventData): ErrorClientLogInfo {
  const code = (MEDIA_ERROR_CODES[error.code as number] || error.code || error.type) ?? UNKNOWN_ERROR;
  const reason = error.reason;
  const message = (error.message || error.details) ?? UNKNOWN_ERROR;
  const originalMessage = error.originalMessage;
  const response: Partial<ErrorEventData['response']> = error.response;
  if (response && (typeof response.data !== 'string' || response.data.length > 100)) {
    delete response.data;
  }
  if (response?.url) {
    response.url = trimQueryString(response.url);
  }
  const { errorType, errorCode } = convertErrorToUnifiedEnum(error);
  const subError = [
    error?.err?.message,
    error.error?.message,
    error.error?.toString(),
  ].filter(Boolean).join('-');
  return {
    error_code: code as string,
    // We don't want to see so many unknown errors in our data.
    // Let's collect some more information about the error.
    error_message: (message === UNKNOWN_ERROR && message === code) ? JSON.stringify(error) : message,
    originalMessage,
    fatal: isFatalError(error),
    reason,
    sub_error: subError,
    // Hls.js frag load error information
    levelUrl: error.levelUrl,
    fragUrl: error.fragUrl,
    response,
    levelLoadTimes: error.levelLoadTimes,
    fragmentRetryTimes: error.fragmentRetryTimes,
    hasMediaKeys: error.hasMediaKeys,
    qos_error_type: errorType,
    qos_error_code: errorCode,
  };
}
