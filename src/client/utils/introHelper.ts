/**
 * This file should only be used in entry "intro", please don't be confused about it with `common/utils/introHelper`
 */

// RegExp list for "isValidRedirectPath"
const validRedirectUrlRegexpList = [
  /^\/([?#].*)?$/,
  /^\/ott\/(player|androidplayer|live)\/\d+([?#].*)?$/,
  /^\/(video|series)\/[^/]+/,
  /^\/container\/(regular|channel)\/[^/]+/,
  /^\/search([?#].*)?$/,
  /^\/personalization-title([?#].*)?$/,
];

/**
 * validate "redirectPath" based on our own rules
 *
 * @export
 * @param {string} value
 * @returns {boolean}
 */
export function isValidRedirectPath(value: string): boolean {
  return validRedirectUrlRegexpList.some((regexp) => regexp.test(value));
}

export class XboxActivationURIError extends Error {}

function getQueryParamFromWindowsURI(uri: any /* Windows.Foundation.Uri */, name: string): string | null {
  if (__OTTPLATFORM__ === 'XBOXONE') {
    // https://docs.microsoft.com/en-us/uwp/api/windows.foundation.wwwformurldecoder
    try {
      return uri.queryParsed.getFirstValueByName(name);
    } catch {
      return null;
    }
  }
  throw new Error('Function not supported on non-Xbox platforms');
}

const XBOX_SUPPORTED_VIEWS = ['player', 'home', 'live'];

function isValidContentId(contentId: string | null): boolean {
  return !!contentId && !contentId.startsWith('0');
}

export function parseXboxActivationURI(uri: any /* Windows.Foundation.Uri */): string {
  if (__OTTPLATFORM__ === 'XBOXONE') {
    const view = getQueryParamFromWindowsURI(uri, 'view');
    if (!view || XBOX_SUPPORTED_VIEWS.indexOf(view) < 0) {
      throw new XboxActivationURIError(`Unsupported view param ${view}`);
    }
    const contentId = getQueryParamFromWindowsURI(uri, 'content_id');
    if ((view === 'player' || view === 'live') && !isValidContentId(contentId)) {
      throw new XboxActivationURIError(`Invalid or missing content_id ${contentId}`);
    }
    let destinationURI: string;
    switch (view) {
      case 'player':
        destinationURI = `/ott/player/${contentId}`;
        break;
      case 'live':
        destinationURI = `/ott/live/${contentId}`;
        break;
      default:
        destinationURI = '/';
        break;
    }

    const utmParams = ['utm_campaign', 'utm_medium', 'utm_source', 'utm_content'].reduce((accum, next) => {
      const paramValue = getQueryParamFromWindowsURI(uri, next);
      if (paramValue) {
        if (accum !== '') {
          accum += '&';
        }
        accum += `${next}=${paramValue}`;
      }
      return accum;
    }, '');
    if (utmParams !== '') {
      destinationURI += `?${utmParams}`;
    }

    return destinationURI;
  }
  throw new Error('Function not supported on non-Xbox platforms');
}

// This is extracted from webpack/tools/html-helpers.js
export function getIntroVideoSources() {
  const baseSrcPath = 'https://mcdn.tubitv.com/video/intro/';
  const webMType = 'video/webm; codecs="vp9, vorbis"';
  const mp4Type = 'video/mp4';

  return [
    { src: `${baseSrcPath}intro_repaint.webm`, type: webMType },
    { src: `${baseSrcPath}intro_repaint.mp4`, type: mp4Type },
  ];
}
