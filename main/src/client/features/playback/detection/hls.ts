export const isProgressiveFetchSupported = (): boolean => {
  /* istanbul ignore next */
  if (
    // @ts-expect-error fetch should always be defined
    window.fetch
    && window.AbortController
    && window.ReadableStream
    && window.Request
  ) {
    try {
      new window.ReadableStream({}); // eslint-disable-line no-new
      return true;
    } catch (e) {
      /* noop */
    }
  }
  return false;
};
