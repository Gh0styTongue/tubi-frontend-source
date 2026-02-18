import { clamp } from '@adrise/utils/lib/tools';
import { useCallback } from 'react';

import { exposeToTubiGlobal } from 'client/global';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import useLatest from 'common/hooks/useLatest';
import type { Video } from 'common/types/video';

interface useAttachGlobalsParams {
  video: Video;
}

export const useAttachGlobals = ({ video: { duration, credit_cuepoints = {} } }: useAttachGlobalsParams) => {
  const durationRef = useLatest(duration);
  const postludeRef = useLatest(credit_cuepoints.postlude);

  useOnPlayerCreate(useCallback((player) => {
    exposeToTubiGlobal({
      tubiPlayer: {
        seekTo: (pos: string | number) => {
          const position = String(pos);
          if (Number.isFinite(pos)) {
            player.seek(parseFloat(position));
          } else if (/^\d+%$/.test(position)) {
            const percent = clamp(parseFloat(position) / 100, 0, 1);
            player.seek(Math.floor(percent * durationRef.current));
          } else if (position === 'credits' && postludeRef.current) {
            player.seek(postludeRef.current);
          } else {
            throw new Error(`Unrecognized value for position when calling tubiPlayer.seekTo(${position})`);
          }
        },
      },
    });
  }, [durationRef, postludeRef]));
};
