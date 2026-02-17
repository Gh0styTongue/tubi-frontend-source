/**
 * check whether a position is a valid number
 * @param position
 * @returns {boolean}
 */
export const isValidPosition = (position: unknown): position is number => {
  // position value could be NaN or None
  return typeof position === 'number' && !isNaN(position);
};
