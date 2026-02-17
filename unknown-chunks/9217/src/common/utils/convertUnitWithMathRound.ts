export function convertUnitWithMathRound(value?: number, multiplier: number = 1): number | undefined {
  return value !== undefined ? Math.round(value * multiplier) : undefined;
}
