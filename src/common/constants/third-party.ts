/**
 * NB: The following should match the version of the @sentry/browser package installed (`npm ls @sentry/browser`) AND
 * that version must be available on our CDN (https://mcdn.tubitv.com/tubitv-assets/js/sentry/{VERSION}/bundle.min.js should exist).
 *
 * If it does not exist on our CDN, see the `tubitv-assets/js/sentry` directory in the `adrise_cdn` repo for instructions
 * on how to grab the latest version easily and create a new PR for it.
 *
 * Do not update the version below until that is done and the new CDN has been re-deployed.
 */
export const sentryVersion = '7.69.0';
