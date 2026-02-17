import { useEffect, useState } from 'react';

import { AD_BLOCK_DETECTED, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';
import AdBlockerDetector from 'web/features/playback/services/AdBlockerDetector';

export const useCheckForAdBlocker = () => {
  const [adBlockerFound, setAdBlockerFound] = useState(false);
  useEffect(() => {
    const adBlockerDetector = new AdBlockerDetector({ debug: __STAGING__ || __DEVELOPMENT__ && !__TESTING__ });
    adBlockerDetector.check()
      .then((isAdBlockerDetected) => {
        if (isAdBlockerDetected) {
          setAdBlockerFound(true);
          /* istanbul ignore next */
          trackLogging({
            type: TRACK_LOGGING.videoInfo,
            subtype: AD_BLOCK_DETECTED,
            message: {},
          });
        }
      });
  }, []);
  return { adBlockerFound };
};
