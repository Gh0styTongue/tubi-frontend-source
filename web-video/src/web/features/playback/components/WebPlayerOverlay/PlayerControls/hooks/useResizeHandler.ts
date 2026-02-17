import { throttle } from 'lodash';
import { useEffect, useRef, useState } from 'react';

import { addEventListener, removeEventListener } from 'common/utils/dom';

const THROTTLE_RESIZE_MS = 250;

export const useResizeHandler = () => {
  const [showMobileDesign, setShowMobileDesign] = useState(false);

  // allows the callback to access the latest state value so that we
  // do not need to re-run the effect when the state changes
  const latestShowMobileDesignRef = useRef(showMobileDesign);

  /**
   * Intended to run on mount to set up the subscription
   */
  useEffect(() => {
    const handleResize = throttle(() => {
      const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (!latestShowMobileDesignRef.current && viewportWidth <= 960) {
        setShowMobileDesign(true);
        latestShowMobileDesignRef.current = true;
      }
      if (latestShowMobileDesignRef.current && viewportWidth > 960) {
        setShowMobileDesign(false);
        latestShowMobileDesignRef.current = false;
      }
    }, THROTTLE_RESIZE_MS);
    handleResize();
    addEventListener(window, 'resize', handleResize);
    return () => {
      handleResize.cancel();
      removeEventListener(window, 'resize', handleResize);
    };
  }, []);

  return { showMobileDesign };
};
