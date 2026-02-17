import { getIntCuePoint } from 'common/utils/video';

export function constrainNowPosition(position: number): number {
  if (typeof position === 'undefined') return 0;
  if (Number.isNaN(position)) return 0;
  if (position && (position < 0 || !isFinite(position))) return 0;
  return getIntCuePoint(position);
}
