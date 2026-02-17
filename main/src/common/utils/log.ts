import type { DictionaryValues } from 'ts-essentials';

import { CONTENT_NOT_FOUND, INVALID_CONTENT_ID } from 'common/constants/error-types';
import type * as errTypes from 'common/constants/error-types';

/**
 * format error instance to pretty print in log
 * `bunyan` cannot pretty print error instance when it's a object property
 * Formatter copied from https://github.com/trentm/node-bunyan/blob/5c2258ecb1d33ba34bd7fbd6167e33023dc06e40/lib/bunyan.js#L1141
 * @link https://github.com/trentm/node-bunyan/issues/369
 * @param err
 * @returns {object}
 */
export const formatError = (err: Error | Record<string, unknown>) => __SERVER__ && err instanceof Error ? {
  message: err.message,
  name: err.name,
  stack: err.stack || err.toString(),
  // code: err.code,
  // signal: err.signal,
} : err;

export const getLogLevel = (errType?: DictionaryValues<typeof errTypes>): 'info' | 'error' => {
  switch (errType) {
    case CONTENT_NOT_FOUND:
      return 'info';
    case INVALID_CONTENT_ID:
      // INVALID_CONTENT_ID will should not appear in ott platforms except bugs
      return __ISOTT__ ? 'error' : 'info';
    default:
      return 'error';
  }
};
