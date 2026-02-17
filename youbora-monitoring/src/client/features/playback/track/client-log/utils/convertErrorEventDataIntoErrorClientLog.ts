import { MEDIA_ERROR_CODES } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { trimQueryString } from '@adrise/utils/lib/url';

import { isFatalError } from 'client/features/playback/error/isFatalError';
import { convertErrorToUnifiedEnum } from 'client/features/playback/utils/convertErrorToUnifiedEnum';

import type { ErrorClientLogInfo } from './types';
import { UNKNOWN_ERROR } from './types';

export function convertErrorEventDataIntoErrorClientLog(error: ErrorEventData): ErrorClientLogInfo {
  const code = (MEDIA_ERROR_CODES[error.code ?? ''] || error.code || error.type) ?? UNKNOWN_ERROR;
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
  const subError: string = [
    `${error.err?.code ?? ''}`,
    `${error.err?.name ?? ''}`,
    `${error.err?.message ?? ''}`,
    `${error.error?.toString() ?? ''}`,
  ].filter(item => !!item).join('-');
  return {
    error_code: code,
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
    flushArea: error.flushArea,
    hasMediaKeys: error.hasMediaKeys,
    qos_error_type: errorType,
    qos_error_code: errorCode,
  };
}
