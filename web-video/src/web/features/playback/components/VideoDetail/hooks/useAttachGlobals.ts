import type {
  Player,
} from '@adrise/player';
import { clamp } from '@adrise/utils/lib/tools';

import { exposeToTubiGlobal } from 'client/global';
import type { Video } from 'common/types/video';

interface useAttachGlobalsParams {
  playerRef: React.MutableRefObject<InstanceType<typeof Player> | null>;
  video: Video;
}
/**
 *
 */
export const useAttachGlobals = ({ playerRef, video: { duration, credit_cuepoints = {} } }: useAttachGlobalsParams) => {
  const attachGlobals = () => {
    exposeToTubiGlobal({
      tubiPlayer: {
        seekTo: (pos: string | number) => {
          const position = String(pos);
          if (!playerRef.current) return;
          if (Number.isFinite(pos)) {
            playerRef.current.seek(parseFloat(position));
          } else if (/^\d+%$/.test(position)) {
            const percent = clamp(parseFloat(position) / 100, 0, 1);
            playerRef.current.seek(Math.floor(percent * duration));
          } else if (position === 'credits' && credit_cuepoints.postlude) {
            playerRef.current.seek(credit_cuepoints.postlude);
          } else {
            throw new Error(`Unrecognized value for position when calling tubiPlayer.seekTo(${position})`);
          }
        },
      },
    });

  };
  return { attachGlobals };
};
