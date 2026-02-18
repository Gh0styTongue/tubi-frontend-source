import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';

const OTT_CHANNEL_REGEX = /^\/ott\/live\/([a-zA-Z0-9_-]+)$/;
const WEB_CHANNEL_REGEX = /^\/live\/([^/]+)(?:\/([^/]+))?$/;

export type LinearPageTypes = 'home' | 'epg' | 'channel' | 'unknown';

export const getLinearPageType = (): LinearPageTypes => {
  const pathname = getCurrentPathname();
  if (pathname === OTT_ROUTES.home || pathname === WEB_ROUTES.home) {
    return 'home';
  }
  if (pathname === OTT_ROUTES.liveMode || pathname === WEB_ROUTES.live) {
    return 'epg';
  }
  if (OTT_CHANNEL_REGEX.test(pathname) || WEB_CHANNEL_REGEX.test(pathname)) {
    return 'channel';
  }

  return 'unknown';
};
