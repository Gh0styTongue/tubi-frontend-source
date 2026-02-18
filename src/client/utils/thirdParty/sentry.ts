// We should NOT import from @sentry/browser
// But we can import types from it
// eslint-disable-next-line no-restricted-imports
import type * as Sentry from '@sentry/browser';

import type { RemoteConfigState } from 'common/constants/constants';
import { SENTRY_ON_LOAD_EVENT_NAME } from 'common/constants/constants';
import { DEFAULT_SENTRY_RATE } from 'common/constants/sample-devices';
import { sentryVersion } from 'common/constants/third-party';
import type { User } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { setupSentryStream } from 'common/helpers/logging/bunyanLogger';
import type StoreState from 'common/types/storeState';
import { loadScript } from 'common/utils/dom';
import config from 'src/config';

import { ThirdPartyScript } from './thirdPartyScript';

declare global {
  interface Window {
    Sentry?: typeof Sentry;
    SENTRY_CLIENT_DSN: string;
    __REMOTE_CONFIG__: RemoteConfigState;
  }
}

interface sentryScope {
  setTag: (key: string, value: string | boolean | number) => void;
  setUser: (user: any) => void;
}

const BLOCKED_FILENAMES = ['pal.js', '19-launch-bui-pages.user.js'];

export const blockThirdPartyErrors = (event: Sentry.Event) => {
  return event.exception?.values?.some((value) => {
    return value.stacktrace?.frames?.some((frame) => {
      return BLOCKED_FILENAMES.some(name => frame.filename?.includes(name));
    });
  });
};

let sentryDisabled = false;
// NOTE samsung device-hosted package provides a secret DSN because its origin is null
/* istanbul ignore next */
export const setupSentry = (deviceId: string, user?: User) => {
  if (!window.Sentry || sentryDisabled) return;

  // init Sentry
  const { sentryClientDSN } = config;
  const sentryRate = window.__REMOTE_CONFIG__?.sentryRate || DEFAULT_SENTRY_RATE;
  window.Sentry.init({
    dsn: window.SENTRY_CLIENT_DSN || sentryClientDSN,
    release: __RELEASE_HASH__,
    ignoreErrors: [
      /getRemainingTime/,
    ],
    integrations: [
      new window.Sentry.BrowserTracing(),
    ],
    // sampleRate is the sample of errors while tracesSampler is for the sample of performance tracing
    sampleRate: sentryRate.error,
    beforeSend(event) {
      if (blockThirdPartyErrors(event)) {
        return null;
      }
      return event;
    },
    tracesSampler: (samplingContext) => {
      const rate = sentryRate.transition;
      // FIXME: Update Web sample rate for 14-days trail run. 0.007 rate is estimated to consume 800K
      // transactions per month. Will decide the appropriate sample rate after the trail run.
      if (__WEBPLATFORM__ === 'WEB') {
        const personRouteRe = /^\/person\/.+\/.+/i;
        // XXX: Don't use location.pathname! At the time of testing with "sentry/browser@7.69.0", location
        // keeps the same when navigating between pages. So transactionContext.name is used instead.
        const { transactionContext } = samplingContext;

        if (personRouteRe.test(transactionContext.name) && transactionContext.op === 'pageload') {
          return Math.min(20 * rate, 1);
        }
      }

      return rate;
    },
  });

  // setup some global tags to make logging to Sentry more meaningful
  window.Sentry.configureScope((scope: sentryScope) => {
    scope.setTag('environment', __DEVELOPMENT__ ? 'development' : 'production');
    scope.setTag('isServerLog', false);
    scope.setTag('webBackend', __KUBERNETES__ ? 'k8s' : 'infra');
  });

  if (user) {
    const { email, userId } = user;
    window.Sentry.configureScope((scope: sentryScope) => {
      scope.setUser({
        id: userId,
        email,
      });
    });
  } else {
    window.Sentry.configureScope((scope: sentryScope) => {
      scope.setUser({
        id: deviceId,
      });
    });
  }
};

export const disableSentry = () => {
  sentryDisabled = true;
  if (!window.Sentry) return;
  // Use public API to disable via initialization
  window.Sentry.init({
    dsn: '', // Empty DSN prevents sending
    enabled: false,
    integrations: [], // Remove all integrations
    defaultIntegrations: false,
  });

};

class SentrySDK extends ThirdPartyScript {
  name = 'ga4';

  /* istanbul ignore next */
  protected load(onload: () => void) {
    loadScript(`https://mcdn.tubitv.com/tubitv-assets/js/sentry/${sentryVersion}/bundle.tracing.es5.min.js`).then(onload);
  }

  onAppStart(state: StoreState) {
    this.load(/* istanbul ignore next */() => {
      const { auth: { deviceId, user } } = state;

      setupSentry(deviceId!, user as User);

      if (window.Sentry) {
        // Inform the logger to flush the error queue. Please refer to the `flushErrorQueue` function in
        // `src/common/helpers/logging/browserLogger.ts`
        window.dispatchEvent(new Event(SENTRY_ON_LOAD_EVENT_NAME));
      }

      if (__SERVER__ && (__PRODUCTION__ || __STAGING__)) {
        logger.addStream!({
          level: 'error',
          type: 'raw',
          stream: setupSentryStream(),
        });
      }
    });
  }

  // No need to enable/disable tracking as it only collects ip address.
  // Also we need sentry on app start to collect script error.
  // Ref: https://docs.google.com/spreadsheets/d/1Z-e0m-G9YhEt5lIaGJFVF9Idp49AlxwHhargk4EWFdA/
  /* istanbul ignore next */
  onCoppaCompliant() {}

  /* istanbul ignore next */
  onCoppaNotCompliant() {}
}

export default SentrySDK;
