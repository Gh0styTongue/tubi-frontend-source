/**
 * get swipe direction
 * @returns {number} 1 for next, -1 for previous, 0 for none swipe
 */
interface SwipeDirectionParams {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export const isDownSwipe = ({ startX, endX, startY, endY }: SwipeDirectionParams): boolean => {
  // atan2 https://en.wikipedia.org/wiki/Atan2
  const radian = Math.atan2(endY - startY, endX - startX);
  let swipeAngle = Math.round(radian * (180 / Math.PI));
  if (swipeAngle < 0) {
    swipeAngle = 360 - Math.abs(swipeAngle);
  }
  // we are looking at a unit circle where 0 is the eastern point
  // so a down swipe means the angle is the 90 degre section centered on
  // 90 degrees
  return swipeAngle >= 45 && swipeAngle <= 135;
};
