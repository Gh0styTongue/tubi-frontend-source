import {
  setAutoplayCapability,
} from '@adrise/player';
import useLatestForEffect from '@adrise/utils/lib/useLatestForEffect';
import { useEffect, useMemo, useState } from 'react';

import { trackAutoStartCapability } from 'client/features/playback/track/client-log/trackAutoStartCapability';
import { AUTO_START_MUTED } from 'common/constants/constants';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
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
  const { getPlayerInstance } = useGetPlayerInstance();

  // Check if we should use muted autoplay (for account switch scenario)
  const shouldMuteForAutostart = useMemo(() => {
    /* istanbul ignore if */
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get(AUTO_START_MUTED) === 'true';
  }, []);

  // Track if muted autoplay detection has been done
  const [mutedAutoplayChecked, setMutedAutoplayChecked] = useState(false);

  // Store values in refs so effect only runs when getPlayerInstance changes
  const canAutoplayRef = useLatestForEffect(canAutoplay);

  useEffect(() => {
    const player = getPlayerInstance();
    const isMuted = !!player && (player.getMute() || player.getVolume() === 0);
    // canAutoplay starts out as false in the store
    // we recheck for autoplay capability if it's false in case something
    // changed in the browser; otherwise if we found autoplay capability
    // once we don't need to check again
    if (!canAutoplayRef.current) {
      // If autoStartMuted param is present, use muted detection
      if (shouldMuteForAutostart && !mutedAutoplayChecked) {
        detectAutoplay({ muted: true }).then((canPlay) => {
          trackAutoStartCapability({ muted: true, canPlay });
          dispatch(setAutoplayCapability(canPlay));
          setMutedAutoplayChecked(true);
        });
        return;
      }

      detectAutoplay({ muted: isMuted }).then((canPlay) => {
        trackAutoStartCapability({ muted: isMuted, canPlay });
        dispatch(setAutoplayCapability(canPlay));
        if (!canPlay && !isMuted) {
          // Collect some data if we could auto play with mute state
          detectAutoplay({ muted: true }).then((canPlayWithMute) => {
            trackAutoStartCapability({ muted: true, canPlay: canPlayWithMute });
          });
        }
      });
    }
  }, [getPlayerInstance, canAutoplayRef, dispatch, shouldMuteForAutostart, mutedAutoplayChecked]);

  return { canAutoplay, shouldMuteForAutostart };
};
