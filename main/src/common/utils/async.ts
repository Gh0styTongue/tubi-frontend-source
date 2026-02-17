export const safeRequestIdleCallback = (callback: () => void) => {
  if (window && typeof window.requestIdleCallback === 'function') {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};
