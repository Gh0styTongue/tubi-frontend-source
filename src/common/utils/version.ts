import type { AppVersion } from 'common/types/fire';

/**
 * used in android hyb apps or apps that have a native version
 * convert nativeAppVersion string to an object
 * @param nativeAppVersion
 */
export const convertNativeVersionStringToAppVersionObject = (nativeAppVersion?: string): AppVersion | undefined => {
  if (!nativeAppVersion) return;
  const versionArr = nativeAppVersion.split('_');

  // android hybrid app passes the version with format `semver_buildCode` like 2.13.10_151'
  // for platforms like Samsung the version only has semver without buildCode
  if ((__IS_HYB_APP__ || __OTTPLATFORM__ === 'PS4') && versionArr.length !== 2) return;
  const [semver, buildCode] = versionArr;

  return {
    // semver like 2.13.10
    semver,
    clientVersion: `${semver}_${__RELEASE_HASH__.substr(0, 7)}`,
    // build code: like 151 converted to Integer
    code: parseInt(buildCode, 10) || undefined,
  };
};

// this will return 0 if equal, >0 if A > B, <0 if A < B
export const semverCompareTo = (semverA: string | number, semverB: string | number): number => {
  try {
    const parseParams = (tempStr: string | number): number[] => {
      return String(tempStr).split('.').map((value) => {
        const num = Number(value);
        if (isNaN(num)) {
          throw Error('invalid value');
        }
        return num;
      });
    };
    const arrA = parseParams(semverA);
    const arrB = parseParams(semverB);

    let indexA = -1;
    for (const valueA of arrA) {
      ++indexA;
      const valueB = arrB[indexA];
      if (valueB !== undefined) {
        if (valueA > valueB) {
          return 1;
        } if (valueA < valueB) {
          return -1;
        }
        // valueB at current indexA is undefined, so semverA will be greater if non zero
      } else {
        if (valueA > 0) {
          return 1;
        }
      }
      // if at the last value in arrA, check if values exists in arrB beyond current index
      if (arrA.length - 1 === indexA) {
        for (let indexB = indexA + 1; indexB < arrB.length; indexB++) {
          const remainingValueB = arrB[indexB];
          // if any remaining values of arrB are greater than 0
          if (remainingValueB > 0) {
            return -1;
          }
        }
      }
    }
    return 0;
  } catch (error) {
    // catch any error and return an equal value
    return 0;
  }
};

export function isValidSemver(version: string) {
  return /^([0-9]\d*)\.([0-9]\d*)\.([0-9]\d*)$/.test(version);
}

/**
 * convert appVersion object into native version string
 */
export const convertAppVersionToAnalyticsVersion = (appVersion?: AppVersion): string => {
  if (!appVersion) return '';
  let tubiVersion = '';
  if (appVersion && appVersion.semver) {
    tubiVersion = appVersion.semver;
  }
  if (tubiVersion && appVersion.code) {
    tubiVersion += `_${appVersion.code}`;
  }
  return tubiVersion;
};
