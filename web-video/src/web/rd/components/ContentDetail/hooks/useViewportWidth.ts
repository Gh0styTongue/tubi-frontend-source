import { throttle } from 'lodash';
import { useEffect, useState } from 'react';

import { BREAKPOINTS } from 'common/constants/constants';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';

export const RESIZE_THROTTLE_MS = 250;

export const useViewportWidth = () => {
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const [vw, setVw] = useState(isMobile ? BREAKPOINTS.sm : BREAKPOINTS.xl);

  useEffect(() => {

    const handleResize = () => setVw(window.innerWidth);
    const throttledHandleResize = throttle(handleResize, RESIZE_THROTTLE_MS);

    window.addEventListener('resize', throttledHandleResize);
    handleResize();

    return () => {
      throttledHandleResize.cancel();
      window.removeEventListener('resize', throttledHandleResize);
    };
  }, [setVw]);

  return {
    vw,
  };
};
