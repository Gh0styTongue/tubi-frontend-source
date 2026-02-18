import { getIntCuePoint } from './video';

export function formatCuePoint(adBreaks: readonly number[]): { cuePointList: readonly number[], hasFloatCuePoint: boolean } {
  return adBreaks.reduce((acc, adBreak) => {
    if (Number.isInteger(adBreak)) {
      acc.cuePointList.push(adBreak);
      return acc;
    }
    acc.cuePointList.push(getIntCuePoint(adBreak));
    acc.hasFloatCuePoint = true;
    return acc;
  }, {
    cuePointList: [],
    hasFloatCuePoint: false,
  } as { cuePointList: number[], hasFloatCuePoint: boolean });
}
