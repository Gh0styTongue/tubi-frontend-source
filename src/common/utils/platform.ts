import type { UapiPlatformType } from 'common/constants/platforms';
import conf from 'src/config';

const { platform: configPlatform } = conf;

// check whether support touch
export const isTouchDevice = () => document && 'ontouchstart' in document.documentElement;

export const getPlatform = (): UapiPlatformType => configPlatform;

/**
 * Utility function for testing to see if a the current platform matches any of the given platform(s)
 * getPlatform() === PLATFORMS.tizen could be done by isPlatform(PLATFORMS.tizen)
 * isPlatform([PLATFORMS.web, PLATFORMS.tizen])
 * @param {Array|String} p
 * @returns {bool}
 */
export const isPlatform = (p: string | string[]): boolean => {
  const platform = getPlatform();
  if (Array.isArray(p)) {
    return p.indexOf(platform) >= 0;
  }
  return p === platform;
};
