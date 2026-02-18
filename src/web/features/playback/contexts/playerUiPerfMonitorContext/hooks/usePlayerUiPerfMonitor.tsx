import { useContext } from 'react';

import type { PlayerUiPerfMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/monitor/playerUiPerfMonitor';
import { PlayerUiPerfMonitorContext } from 'web/features/playback/contexts/playerUiPerfMonitorContext/playerUiPerfMonitorContext';

/**
 * Allows access to the performance monitor, if it exists
 */
export const usePlayerUiPerfMonitor = (): PlayerUiPerfMonitor | undefined => {
  const value = useContext(PlayerUiPerfMonitorContext);
  return value?.[0];
};
