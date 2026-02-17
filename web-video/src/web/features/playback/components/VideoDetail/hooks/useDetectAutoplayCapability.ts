import {
  setAutoplayCapability,
} from '@adrise/player';
import { useEffect } from 'react';

import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { detectAutoplay } from 'common/utils/autoplayDetection';
import { canAutoplaySelector } from 'web/features/playback/selectors/player';

/**
 * Can we autostart the video element? With help from Redux, remembers
 * this across hook remounts
 */
export const useDetectAutoplayCapability = () => {
  const canAutoplay = useAppSelector(canAutoplaySelector);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // canAutoplay starts out as false in the store
    // we recheck for autoplay capability if it's false in case something
    // changed in the browser; otherwise if we found autoplay capability
    // once we don't need to check again
    if (!canAutoplay) {
      detectAutoplay({ muted: false }).then((canPlay) => {
        dispatch(setAutoplayCapability(canPlay));
      });
    }
  // Intentionally run once after first render and never again
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { canAutoplay };
};
