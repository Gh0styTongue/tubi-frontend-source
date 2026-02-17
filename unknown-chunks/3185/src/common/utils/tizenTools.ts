function getManufactureYear(): number {
  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent || __OTTPLATFORM__ !== 'TIZEN') {
    return NaN;
  }

  for (const map of [
    ['2.3', 15],
    ['2.4', 16],
    ['3.0', 17],
    ['4.0', 18],
    ['5.0', 19],
  ] as [string, number][]) {
    if (userAgent.indexOf(`Tizen ${map[0]}`) !== -1) {
      return map[1];
    }
  }

  return NaN;
}

/**
 * 2015 devices is slow
 * @link http://developer.samsung.com/tv/develop/tutorials/app-fundamentals/platform-detection
 * @param {String} userAgent getState().ui.userAgent.ua
 * @returns {Boolean}
 */
export const isSamsung2015 = () => getManufactureYear() === 15;
export const isSamsung2018 = () => getManufactureYear() === 18;

export const isSamsung2017Or2018 = () => [17, 18].includes(getManufactureYear());

export const isSamsungBeforeYear = (year: number) => getManufactureYear() < year;

export const isSamsung2018Or2019 = () => [18, 19].includes(getManufactureYear());

// We can remove these functions later
export const isSamsungBefore2017 = () => isSamsungBeforeYear(17);

export const isSamsungBefore2018 = () => isSamsungBeforeYear(18);

export const isSamsungBefore2019 = () => isSamsungBeforeYear(19);
