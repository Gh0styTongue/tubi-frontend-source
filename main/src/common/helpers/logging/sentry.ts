import type * as NodeSentry from '@sentry/node';
import { Severity } from '@sentry/types';

import type { LoggerRecord } from './bunyanLogger';

/**
 * sentryErrorHandler: using new unified API to record extra information for Sentry
 * @param  sentryClient [Sentry instance]
 * @param  message      [This can be a message or exception. If it is a string
 *                       use captureMessage and if it an instance of Error then use
 *                       captureException]
 * @param  data         [Any additional data that you would like to see in Sentry]
 * @param  level        [Level of error. Defaults to `info`]
 * @param  type         [type can be `message` or `exception` for captureMessage and
 *                       aptureException respectively]
 */
export function sentryErrorHandler({
  sentryClient,
  message,
  data,
  level,
  exception,
}: {
  sentryClient: typeof NodeSentry,
  message: string,
  data: { extra: Record<string, string>, tags: Record<string, string> },
  level: Severity,
  exception?: Error,
}) {
  const { extra, tags } = data;
  sentryClient.withScope((scope) => {
    scope.setExtras(extra);
    scope.setLevel(level);
    scope.setTags(tags);
    if (exception) {
      sentryClient.captureException(exception);
    } else {
      sentryClient.captureMessage(message);
    }
  });
}

const bunyanLevelToSentrySeverity: Record<number, Severity> = {
  60: Severity.Critical,
  50: Severity.Error,
  40: Severity.Warning,
  30: Severity.Info,
  20: Severity.Debug,
};

export interface FormattedLoggerRecord {
  options: {
    level: Severity;
    tags: Record<string, any>;
    extra: Record<string, any>;
    webBackend?: string;
  };
  message?: string;
  exception?: Error;
}

export function formatBunyanLoggerRecordToSentry(record: LoggerRecord, fallbackMessage?: string): FormattedLoggerRecord {
  const { err, error, msg } = record;
  const exception = err || error;
  const { name, hostname } = record;

  // pull out the fields we want from the bunyan record object
  const options: FormattedLoggerRecord['options'] = {
    level: bunyanLevelToSentrySeverity[record.level] || Severity.Info,
    tags: { name, hostname },
    extra: {},
    webBackend: __KUBERNETES__ ? /* istanbul ignore next */ 'k8s' : 'infra',
  };

  const excludedKeys = ['name', 'hostname', 'pid', 'msg', 'time', 'v', 'err', 'error', 'level'];

  // extra field for sentry, shows up as additional data in the sentry UI
  for (const key in record) {
    if (!excludedKeys.includes(key)) {
      options.extra[key] = record[key as keyof LoggerRecord];
    }
  }

  let message = msg || fallbackMessage;
  if (exception) {
    message = exception.message;
  }

  return { message, options, exception };
}
