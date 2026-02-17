export function isEmptyBufferedRange(range: number[][]): boolean {
  // empty array for most devices: []
  return range.length === 0
  // special case for parts of LGTV: [[0,0]]
  || (
    range.length === 1
    && range[0].length === 2
    && range[0][0] === 0
    && range[0][1] === 0
  );
}
