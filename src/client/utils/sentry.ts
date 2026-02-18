// We should NOT import from @sentry/browser
// But we can import types from it
// eslint-disable-next-line no-restricted-imports
import type { Breadcrumb } from '@sentry/browser';

export function addSentryBreadcrumb(breadcrumb: Breadcrumb) {
  const { Sentry } = window;
  if (!Sentry || typeof Sentry.addBreadcrumb !== 'function') return;
  Sentry.addBreadcrumb(breadcrumb);
}
