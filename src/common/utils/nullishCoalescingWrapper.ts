export function nullishCoalescingWrapper<T>(value: T | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}
