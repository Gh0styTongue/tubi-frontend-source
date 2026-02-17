import type { Player } from '@adrise/player';
import { useContext, useEffect, useRef } from 'react';
import { useStore } from 'react-redux';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { Monitoring } from 'client/features/playback/monitor/monitoring';
import type { SetupYouboraOption } from 'client/features/playback/monitor/setupYoubora';
import { setupYoubora } from 'client/features/playback/monitor/setupYoubora';
import { YouboraExperimentMapContext } from 'common/features/playback/context/YouboraExperimentMapContext';
import { isYouboraEnabled } from 'common/selectors/experiments/remoteConfig';
import type StoreState from 'common/types/storeState';

export function useYoubora(
  player: LivePlayerWrapper | Player | null,
  option: Omit<SetupYouboraOption, 'youboraExperimentMap'>,
) {
  const monitor = useRef<Monitoring | undefined>(undefined);
  const context = useContext(YouboraExperimentMapContext);
  const youboraExperimentMap = context?.getMap() ?? {};
  const store = useStore<StoreState>();

  useEffect(() => {
    if (!player || !isYouboraEnabled(option.playerName, store.getState())) {
      return;
    }

    setupYoubora(player, {
      ...option,
      youboraExperimentMap,
    }).then((youbora) => {
      monitor.current = youbora;
    });

    return () => {
      monitor.current?.remove();
    };
    // Only listen to the player life cycle
    // We don't need to rebind the monitor if the player doesn't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);
}
