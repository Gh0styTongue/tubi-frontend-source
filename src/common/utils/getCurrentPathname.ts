/**
 * Get the current page location URI
 * For Samsung platform we use HashHistory
 * and for all others we use BrowserHistory
 */
export const getCurrentPathname = () => {
  /**
   * We cannot access window on the server side.
   * So return if __SERVER__
   */
  if (__SERVER__) return '';

  const { hash, pathname } = window.location;
  if (__OTTPLATFORM__ === 'TIZEN') {
    // we do not want the leading # and location.search
    return hash.substring(hash.indexOf('#') + 1).split('?')[0];
  }
  return pathname;
};
