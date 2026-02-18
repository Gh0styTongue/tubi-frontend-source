import { isMobileWebkit, isChromeOnAndroidMobile } from '@adrise/utils/lib/ua-sniffing';
import type UAParser from 'ua-parser-js';

import type { UserAgent } from 'common/types/ui';
import { isSamsung2015 } from 'common/utils/tizenTools';

/**
 * pass user agent object from ui store, as returned by ua-parser module
 * return a Boolean
 */
export const mobilePlaybackSupported = ({
  userAgent,
  enableMobileWebIosPlayback,
  enableWebAndroidPlayback,
}: {
  userAgent: Partial<UAParser.IResult> | UserAgent | undefined;
  enableMobileWebIosPlayback?: boolean;
  enableWebAndroidPlayback?: boolean;
  }): boolean => {
  if (!userAgent) return false;
  const enableOnWebAndroid = isChromeOnAndroidMobile(userAgent) && !!enableWebAndroidPlayback;
  const enableOnWebIOS = isMobileWebkit(userAgent) && !!enableMobileWebIosPlayback;
  return enableOnWebAndroid || enableOnWebIOS;
};

/**
 * UNLESS YOU REALLY HAVE TO DO NOT USE THIS!
 * We require knowledge of userAgent for Samsung and potentially others in the future
 * instead you should get it from state: getState().ui.isSlowDevice
 * check whether current device is slow
 * @param {UAParser.IResult} ua useragent as returned by '@adrise/utils/lib/ua-parser'
 * @returns {Boolean}
 */
export const isSlowDevice = (): boolean => {
  return __IS_SLOW_PLATFORM__ || isSamsung2015();
};

/**
 * Check if the browser is supported
 * @link https://tubitv.atlassian.net/wiki/spaces/EC/pages/640385079
 */
export const isBrowserSupported = (ua: UAParser.IResult | UserAgent): boolean => {
  const { browser: { name: browserName, major }, os: { name: osName }, ua: userAgentString } = ua;
  // if `major` is `undefined`, take it as supported browser
  const browserVersion = major ? Number(major) : Number.POSITIVE_INFINITY;
  // redirectdetective.com is a website that graphically plots the sequence of redirects a given URL goes through.
  // Branch.io support is using it, and others might as well in future, so we should consider that user agent supported.
  if (isRedirectDetectiveUserAgent(ua)) {
    return true;
  }
  switch (browserName) {
    case 'Chrome':
    case 'Firefox':
      // Support 70+ on Desktop (not Mobile)
      return ((browserVersion >= 68 && !/(Android|iOS)/i.test(osName ?? '')) || /(Android|iOS)/i.test(osName ?? ''));
    case 'Safari':
      // The following change is required when sharing links on iMessage or Messages app.
      // The user agent string looks like the following on iMessage app on iOS and Mac OSX
      // Eg: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0
      if (userAgentString && userAgentString.indexOf('Facebot') > -1) {
        return true;
      }
      return browserVersion >= 10;
    case 'Opera':
    case 'IE':
      return false;
    default:
      // for other browsers, we take a conservative strategy to avoid blocking false negatives
      return true;
  }
};

function isRedirectDetectiveUserAgent(ua: UAParser.IResult | UserAgent): boolean {
  // After running an ngrok server which I pointed redirectdetective.com to, I saw that their useragent was:
  // Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1
  // Which is basically Chrome 14 on Windows XP. Theoretically, this means the 0.00000001% of people out there genuinely
  // running Chrome v14.x on Windows XP will get incorrectly classified as having a supported browser, but it's just
  // so unlikely that this should be fine. But just to be 99.999999...9% sure it is actually redirectdetective.com,
  // we will check the _exact_ useragent they use.
  return ua.ua === 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1';
}
