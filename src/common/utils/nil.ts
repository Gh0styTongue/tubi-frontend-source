export const hasNil = (...args: unknown[]) => {
  if (args.length === 0) return false;
  return args.some((v) => typeof v === 'undefined' || v === null || Number.isNaN(v));
};
