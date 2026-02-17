import throttle from 'lodash/throttle';

import browserLogger from './browserLogger';
import type { ILogger } from './LoggerInterface';

let logger: ILogger;

if (__SERVER__) {
  logger = require('./clsLogger').default;
} else {
  logger = browserLogger;
}

// throttle error logging to avoid excessive frequency stream writes
export const throttledLogError = throttle((format: unknown, msg: string) => logger.error(format, msg), 200, {
  leading: true,
  trailing: true,
});

/**
 * A logger object has all bunyan log methods.
 * Can be used for server and client.
 */
export default logger;
