import type { ValueOf } from 'ts-essentials';

const FORMAT_RESOLUTION = {
  '4320P': 4320,
  '2160P': 2160,
  '1440P': 1440,
  '1080P': 1080,
  '720P': 720,
  '480P': 480,
  '360P': 360,
  '240P': 240,
  '144P': 144,
};

type FORMAT_RESOLUTION_KEYS = keyof typeof FORMAT_RESOLUTION;
export type GET_FORMAT_RESOLUTION_TYPE = FORMAT_RESOLUTION_KEYS | 'UNKNOWN';

export const getFormatResolution = (width: number, height: number): GET_FORMAT_RESOLUTION_TYPE => {
  const realResolutionNumber = Math.min(width, height);
  if (realResolutionNumber <= 0) return 'UNKNOWN';
  const formatResolutionNumbers: ValueOf<typeof FORMAT_RESOLUTION>[] = Object.values(FORMAT_RESOLUTION).sort((a, b) => a - b);
  let resultNumber: ValueOf<typeof FORMAT_RESOLUTION> = formatResolutionNumbers[0];
  for (let i = 0; i < formatResolutionNumbers.length - 1; i++) {
    if (realResolutionNumber <= formatResolutionNumbers[i]) {
      resultNumber = formatResolutionNumbers[i];
      break;
    } else if (realResolutionNumber > formatResolutionNumbers[i] && realResolutionNumber < formatResolutionNumbers[i + 1]) {
      const previousDiff = realResolutionNumber - formatResolutionNumbers[i];
      const nextDiff = formatResolutionNumbers[i + 1] - realResolutionNumber;
      resultNumber = previousDiff < nextDiff ? formatResolutionNumbers[i] : formatResolutionNumbers[i + 1];
      break;
    }
    if (i === formatResolutionNumbers.length - 2) {
      resultNumber = formatResolutionNumbers[i + 1];
    }
  }
  let result: keyof typeof FORMAT_RESOLUTION = '144P';
  Object.keys(FORMAT_RESOLUTION).forEach(key => {
    if (FORMAT_RESOLUTION[key as keyof typeof FORMAT_RESOLUTION] === resultNumber) {
      result = key as keyof typeof FORMAT_RESOLUTION;
    }
  });
  return result;
};

export function getFormatResolutionValue(width: number, height: number): typeof FORMAT_RESOLUTION[FORMAT_RESOLUTION_KEYS] | -1 {
  const result = getFormatResolution(width, height);
  if (result === 'UNKNOWN') return -1;
  return FORMAT_RESOLUTION[result];
}

