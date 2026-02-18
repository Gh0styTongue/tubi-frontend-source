import { isSlowDevice } from 'common/utils/capabilityDetection';

/**
 * The predefined 3 fidelity levels: High/Medium/Low
 * For platform & devices, the higher level means higher system specs (CPU/GPU/RAM).
 * For styles/animations, the higher level means more performance demanding.
 *
 * This will help us to degrade some animations or effects without tagging current device as a slow
 * platform (which will change how App looks/behaves dramatically).
 *
 * Compared to isSlowPlatform, it provides a little more flexibility to control how UI/UX should behave
 * on different platforms/devices.
 */
export enum FidelityLevel {
  /**
   * devices: Fire TV 4K
   * styles: css blur filter
   */
  High = 30,
  /**
   * devices: Fire TV Gen2
   */
  Medium = 20,
  /**
   * devices: Fire TV Gen1, Stick Gen1, Tizen 2.2
   */
  Low = 10,
}

/**
 * Check if current deviceLevel is match required fidelity level
 * In the future, we can expand `FidelityLevel` to types more than simple numbers,
 * so adding a method to do the value comparison.
 */
export function isFidelityLevelMatch(deviceLevel: FidelityLevel | number, requiredLevel: FidelityLevel | number) {
  return deviceLevel >= requiredLevel;
}

/**
 * [Fire TV User Agent Strings](https://developer.amazon.com/docs/fire-tv/user-agent-strings.html)
 * [Identify Fire TV Devices](https://developer.amazon.com/docs/fire-tv/identify-amazon-fire-tv-devices.html)
 */
export function getFireTvUiFidelity(userAgent: string) {
  // There is a tailing whitespace to separate device id from other parts in UA
  // AFTT: Fire Stick (Gen 2) and Basic Edition (same spec as Gen 2)
  // AFTA: Fire TV Cube - 1st Gen (2018)
  if (userAgent.includes('AFTT ') || userAgent.includes('AFTA ')) {
    return FidelityLevel.Medium;
  }
  // Gen 1 and Stick(Gen 1) device are dual cores/500MB system RAM
  // Note: AFTMM is an high spec device, don't mix with AFTM
  if (userAgent.includes('AFTB ') || userAgent.includes('AFTM ')) {
    return FidelityLevel.Low;
  }
  return FidelityLevel.High;
}

function getChromeVersionFromUA(userAgent?: string) {
  // find major version e.g. `Chrome/79.01.2`, match[1] should be the first capture group 79
  if (userAgent) {
    const match = userAgent.match(/Chrome\/(.*?)(?=\.)/);
    if (match) {
      const versionString = match[1];
      const version = Number(versionString);
      if (!isNaN(version)) {
        return version;
      }
    }
  }
  return null;
}

/**
 * https://webostv.developer.lge.com/discover/specifications/web-engine/
 * WebOS v6 uses Chrome/79
 * WebOS v5 and under (< Chrome/79) should return low fidelity
 */
function getLGTVUiFidelity(userAgent: string) {
  const version = getChromeVersionFromUA(userAgent);
  if (version && version < 79) {
    return FidelityLevel.Low;
  }
  return FidelityLevel.High;
}

export function getDeviceFidelity(userAgent: string) {
  if (isSlowDevice()) {
    return FidelityLevel.Low;
  }

  if (__OTTPLATFORM__ === 'PS4') {
    return FidelityLevel.Low;
  }

  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    return getFireTvUiFidelity(userAgent);
  }

  if (__OTTPLATFORM__ === 'LGTV') {
    return getLGTVUiFidelity(userAgent);
  }

  return FidelityLevel.High;
}
