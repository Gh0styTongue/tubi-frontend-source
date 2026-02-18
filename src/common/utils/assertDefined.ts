/**
 * Ensure a value is defined and return it. If not, run optional callback and throw.
 * Useful for inline assignment: const x = assertDefined(maybeX, onUndefined)
 */
export const assertDefined = <T>(
  value: T | null | undefined,
  onUndefined?: () => never | void,
  message = 'Expected value to be defined',
): NonNullable<T> => {
  if (value === null || typeof value === 'undefined') {
    if (onUndefined) {
      onUndefined();
    }
    throw new Error(message);
  }
  return value as NonNullable<T>;
};
