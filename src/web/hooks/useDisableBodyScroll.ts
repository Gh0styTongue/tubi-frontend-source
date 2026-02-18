import { useCallback, useEffect, useRef } from 'react';

/**
 * hooks to disable body scroll when some overlay elements is displayed,
 * only target to desktop browser currently, maybe we can use
 * https://github.com/willmcpo/body-scroll-lock
 * to do enhance compatibility in different web platforms.
 */
const useDisableBodyScroll = (isOn: boolean) => {
  /* istanbul ignore next: skip ssr testing */
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Can safely ignore conditional hooks since the condition above will never
  // change for a given environment
  /* eslint-disable react-hooks/rules-of-hooks */

  // store body styles
  // eslint-disable-next-line tubitv/no-dom-globals-in-react-hooks
  const body = document.body;
  const bodyHeightRef = useRef(body.style.height);
  const bodyOverflowRef = useRef(body.style.overflow);

  const update = useCallback(() => {
    body.style.height = '100vh';
    body.style.overflow = 'hidden';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restore = useCallback(() => {
    body.style.height = bodyHeightRef.current;
    body.style.overflow = bodyOverflowRef.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOn) {
      update();
    }

    return () => {
      if (isOn) {
        restore();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOn]);

  /* eslint-enable react-hooks/rules-of-hooks */

  return restore;
};

export default useDisableBodyScroll;
