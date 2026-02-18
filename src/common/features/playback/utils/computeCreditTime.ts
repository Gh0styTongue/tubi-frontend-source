/**
 * Compute credit time for video
 * If postlude is not given, calculate credit time following the way on server side:
 * https://github.com/adRise/adrise_unified_api/blob/master/apps/user_device/helpers/content.js#L154
 */
export const computeCreditTime = (duration?: number, credits?: { postlude?: number }): number => {
  let creditTime = Number.POSITIVE_INFINITY;
  if (duration) {
    creditTime = Math.max(duration * 0.95, duration - 60);
  }
  if (credits && credits.postlude) {
    creditTime = credits.postlude;
  }
  return creditTime;
};
