import { PLATFORMS } from 'common/constants/platforms';
import logger from 'common/helpers/logging';
import { REG_LOCALE_URL_PREFIX } from 'i18n/constants';
import conf from 'src/config';

import { isPlatform } from './platform';
import type { RouteTemplate } from './urlPredicates';

/**
 * convert relative url to a full path url
 * @param {String} url a relative path url e.g. //images.adrise.tv/image1.png, or /settings
 * @param {String} [protocol] url protocol
 * @returns {String} full url
 */
export const makeFullUrl = (url: string, protocol?: string): string => {
  let { fqdn } = conf;
  if (!url || url.startsWith('http')) return url;

  let prot;
  if (protocol) {
    prot = protocol;
  } else if (__DEVELOPMENT__) {
    /* istanbul ignore next */
    prot = 'http:';
  } else {
    prot = 'https:';
  }

  if (__IS_NGROK_DEV__ && typeof window !== 'undefined') {
    fqdn = window.location.host;
  }

  return url.startsWith('//') ? `${prot}${url}` : `${prot}//${fqdn}${url}`;
};

/**
 * change the url to given protocol
 * @param url
 * @param protocol, something like `http` or `https`
 */
export const changeUrlProtocol = (url: string, protocol: string): string => {
  if (url.startsWith(`${protocol}:`)) return url;

  // protocol relative url
  const startIndex = url.indexOf('//');
  if (startIndex === -1) return url;

  return `${protocol}:${url.slice(startIndex)}`;
};

export const toRelativeProtocol = (url: string): string => {
  if (!url) return '';
  const idx = url.indexOf('://');
  return idx > 0 ? url.substr(idx + 1) : url;
};

/**
 * Get a piece of a pathname, defaults to last piece: '/account/parental' ==> 'parental'
 * @param pathname - string
 * @param piece - num - index of which piece of the URI you want, 0 indexed (assumes you know what URI will be)
 * @param withSlash - boolean - with a slash in the front of the return value or not
 */
export const getURIPiece = (pathname: string, piece?: number, withSlash?: boolean) => {
  const pathnameArr = pathname.slice(1).split('/');
  const value = piece !== undefined && piece >= 0 ? pathnameArr[piece] : pathnameArr[pathnameArr.length - 1];
  return withSlash ? `/${value}` : value;
};

// convert //abc.com to abc.com
export const removeLeadingSlashes = (url: string): string => (url.indexOf('//') === 0 ? url.substring(2) : url);

export const trimStartSlash = (str: string) => str.replace(/^\//, '');

export const trimTrailingSlash = (str: string) => {
  return str.endsWith('/') ? str.slice(0, -1) : str;
};

export const trimBaseUrl = (baseUrl: string, url: string) => {
  return trimStartSlash(url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url);
};

export const addLocalePrefix = (url: string) => {
  return `/(:locale/)${trimStartSlash(url)}` as RouteTemplate;
};

export const hasLocalePrefix = (url: string) => {
  return REG_LOCALE_URL_PREFIX.test(url);
};

export const removeLocalePrefix = (url: string) => {
  if (hasLocalePrefix(url)) {
    return `/${url.replace(REG_LOCALE_URL_PREFIX, '')}`;
  }
  return url;
};

const invalidPercentCharRegex = /%(?![A-F0-9]{2})/g;
export const fixMalformedQueryString = (url: string): string => {
  const questionMarkIndex = (url || '').indexOf('?');
  if (questionMarkIndex < 0) return url;
  const qs = url.substr(questionMarkIndex + 1);
  // On Vizio, we saw examples of query strings like:
  //  utm_source=--US_Targeting-Users_CPM_Hero_VizioTV_Vizio___Vizio-UA_Hero%%_CForward_1560x390_Video__GirlsGetawayGoneWrong-AP&...
  // Note the double % character. There were also variants with a single % character. We need to fix both.
  // We don't want to replace genuine escape sequences (%XX, where X is a hexadecimal digit), though. So we use a
  // negative lookahead to accomplish this.
  const newQs = qs.replace(invalidPercentCharRegex, encodeURIComponent('%'));
  const newUrl = url.replace(qs, newQs);
  try {
    // If decoding the corrected URI throws, we should fallback to the home page.
    decodeURIComponent(newUrl);
    return newUrl;
  } catch (ex) {
    logger.error(ex, `Malformed URI: ${newUrl}`);
    return '/';
  }
};

export const getUrlDomain = (url: string = '') => {
  const parts = url.split('/');
  return parts[url.includes('://') ? 2 : 0];
};

export function getUrlParam(): Record<string, string | undefined> {
  const res = {};
  let query;
  if (isPlatform(PLATFORMS.tizen)) {
    // get "v=1" from "#/settings?v=1"
    query = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  } else {
    query = window.location.search.substring(1);
  }

  query.split('&').forEach((str) => {
    const pair = str.split('=');
    let val: string | undefined = pair[1];
    if (val === '' || val === 'false') {
      val = undefined;
    }
    res[pair[0]] = val;
  });

  return res;
}
