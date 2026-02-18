import type { Player, TimeEventData } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { FREEZED_EMPTY_FUNCTION, MAX_RESEEK_ATTEMPTS, RESTART_CLOSE_OFFSET, SEEK_TOLERANCE_OFFSET } from 'common/constants/constants';
import logger from 'common/helpers/logging';

import { trackReSeek, trackSeekRestart } from '../track/client-log';

export function attachReseek(player: InstanceType<typeof Player>) {
  // track reseek attempts by targetPosition
  // added for playstation wrapper, now we use for all 'seek' calls as wrapper 'seek' may fail
  let reseekAttempts: { [x: number]: number } = {};
  let onTime: (event: TimeEventData) => void = FREEZED_EMPTY_FUNCTION;
  let onSeeked: () => void = FREEZED_EMPTY_FUNCTION;

  const onSeek = (e: { position: number; offset: number; }) => {
    const { offset: targetPosition } = e;

    // catch restart issue and log
    if (!reseekAttempts[targetPosition]) {
      reseekAttempts[targetPosition] = 0;
    }

    player.removeListener(PLAYER_EVENTS.seeked, onSeeked);
    player.removeListener(PLAYER_EVENTS.time, onTime);

    onTime = ({ position }: { position: number; duration: number; }) => {
      // if current position is close to 0 && targetPosition is larger than max segment length, we consider it as a restart
      const isRestart = targetPosition > SEEK_TOLERANCE_OFFSET && position <= RESTART_CLOSE_OFFSET;
      if (!isRestart) return;

      // try to seek `MAX_RESEEK_ATTEMPTS` before log error
      if (reseekAttempts[targetPosition] >= MAX_RESEEK_ATTEMPTS) {
        reseekAttempts = {};

        // log to sentry
        logger.error({ targetPosition, position }, 'Player - restarts happened');

        // log to datascience
        trackSeekRestart({
          targetPosition,
          position,
        });
      } else {
        player.seek(targetPosition);
        reseekAttempts[targetPosition]++;

        trackReSeek({
          targetPosition,
          position,
        });
      }
    };

    onSeeked = () => {
      player.once(PLAYER_EVENTS.time, onTime);
    };
    player.once(PLAYER_EVENTS.seeked, onSeeked);
  };

  // handle seeking failure
  player.on(PLAYER_EVENTS.seek, onSeek);

  return () => {
    player.removeListener(PLAYER_EVENTS.seek, onSeek);
    player.removeListener(PLAYER_EVENTS.seeked, onSeeked);
    player.removeListener(PLAYER_EVENTS.time, onTime);
  };
}
