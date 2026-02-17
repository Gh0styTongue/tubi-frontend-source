export const ensureStorageIsAccessible = () => {
  if (!__ISOTT__) {
    // some of our dependencies do not put a try...catch around checking for
    // window.localStorage or window.sessionStorage. This can lead to a
    // SecurityError being thrown. This sets the values to `undefined`
    // to avoid the error being thrown.
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.localStorage;
    } catch {
      Object.defineProperty(window, 'localStorage', { value: undefined });
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.sessionStorage;
    } catch {
      Object.defineProperty(window, 'sessionStorage', { value: undefined });
    }
  }
};
