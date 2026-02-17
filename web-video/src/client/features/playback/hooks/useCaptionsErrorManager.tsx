import type { Player } from '@adrise/player';
import { useEffect } from 'react';

import { CaptionsErrorManager } from '../services/CaptionsErrorManager';

type CaptionsErrorManagerProps = {
  player: Player | null | undefined;
};

export const useCaptionsErrorManager = ({ player }: CaptionsErrorManagerProps) => {
  useEffect(() => {
    /* istanbul ignore next */
    if (!player) return;
    const instance = new CaptionsErrorManager({
      player,
    });
    return () => {
      instance.destroy();
    };
  }, [player]);
};

export function CaptionsErrorManagerWrapper(props: CaptionsErrorManagerProps) {
  useCaptionsErrorManager(props);
  return null;
}
