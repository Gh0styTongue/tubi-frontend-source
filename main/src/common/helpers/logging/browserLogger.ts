import type { SeverityLevel } from '@sentry/types';

import { SENTRY_ON_LOAD_EVENT_NAME } from 'common/constants/constants';

import type { LoggerRecord } from './bunyanLogger';
import type { ILogger } from './LoggerInterface';
import type { FormattedLoggerRecord } from './sentry';
import { formatBunyanLoggerRecordToSentry } from './sentry';

type WrapLevel = Exclude<SeverityLevel, 'critical'>;
type LevelAdjustments = { pattern: RegExp; level: WrapLevel }[];
type ErrorQueue = { level: WrapLevel; firstArg: unknown; fallbackMessage?: string }[];

const LEVEL_ADJUSTMENTS: LevelAdjustments = [{ pattern: /request timeout/, level: 'info' }];

// Using dynamic import here to avoid a nasty dependency cycle that actually
// causes stuff to break. This module imports ApiClient and ApiClient imports
// this module. The code then gets into a chicken/egg situation and
// can't resolve the imports properly, leading to JS errors about various object
// properties being undefined. Lazy-loading the ApiClient here is an easy way to
// workaround that issue, and we're only using it temporarily anyway.
const clientPromise = import('common/helpers/ApiClient')
  .then((module) => module.default)
  .then((ApiClient) => new ApiClient());

const wrap = (level: WrapLevel) => (firstArg: unknown, fallbackMessage?: string) => {
  const sentry = window.Sentry;
  const errorQueue: ErrorQueue = [];

  const flushErrorQueue = () => {
    while (errorQueue.length > 0) {
      const { level, firstArg, fallbackMessage } = errorQueue.shift()!;
      wrap(level)(firstArg, fallbackMessage);
    }
  };

  if (!sentry) {
    errorQueue.push({ level, firstArg, fallbackMessage });
    window.addEventListener(SENTRY_ON_LOAD_EVENT_NAME, flushErrorQueue, { once: true });
    return;
  }

  sentry.withScope((scope) => {
    let message: string | undefined;
    let error: Error | undefined;

    let reformattedData: FormattedLoggerRecord = { options: {} as FormattedLoggerRecord['options'] };

    /* istanbul ignore else */
    if (typeof firstArg === 'string') {
      message = firstArg;
    } else if (firstArg instanceof Error) {
      message = firstArg.message;
      error = firstArg;
    } else if (typeof firstArg === 'object') {
      reformattedData = formatBunyanLoggerRecordToSentry(firstArg as LoggerRecord, fallbackMessage);
      if (reformattedData.options.extra) scope.setExtras(reformattedData.options.extra);
      if (reformattedData.options.tags) scope.setTags(reformattedData.options.tags);
      message = reformattedData.message;
      error = reformattedData.exception;
    }

    scope.setLevel(level);

    /* istanbul ignore else */
    if (level === 'error' || level === 'fatal') {
      sentry.captureException(error || message);
      // temporarily send log to Datadog for debugging
      // TODO: remove this after the API migration off of node proxy is complete
      const { extra, tags } = reformattedData.options;
      const messages = [fallbackMessage, message, error?.message].filter((s): s is string => s != null);
      const datadogLogLevel = LEVEL_ADJUSTMENTS.reduce<WrapLevel>((prevLevel, { pattern, level: newLevel }) => {
        if (messages.some((msg) => pattern.test(msg))) {
          return newLevel;
        }
        return prevLevel;
      }, level);
      /* istanbul ignore next */
      clientPromise.then((client) =>
        client.sendBeacon('/oz/log', {
          data: {
            customLogMessage: message,
            fallbackMessage,
            error,
            errorMessage: error?.message,
            extra,
            isClientLog: true,
            severity: datadogLogLevel,
            tags,
          },
        })
      );
    } else if (message) {
      // eslint-disable-next-line no-console
      console[level === 'warning' ? 'warn' : level](message);
    }
  });
};

const logger: ILogger = {
  trace: wrap('info'),
  debug: wrap('debug'),
  info: wrap('info'),
  warn: wrap('warning'),
  error: wrap('error'),
  fatal: wrap('fatal'),
};

export default logger;
