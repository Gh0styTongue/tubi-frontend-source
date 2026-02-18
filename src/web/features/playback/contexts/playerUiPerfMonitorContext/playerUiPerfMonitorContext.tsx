import type { ReactNode } from 'react';
import React, { createContext, useState } from 'react';

import type { PlayerUiPerfMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/monitor/playerUiPerfMonitor';

type PlayerUiPerfMonitorContextType = [
  PlayerUiPerfMonitor | undefined,
  React.Dispatch<React.SetStateAction<PlayerUiPerfMonitor | undefined>>
];

export const PlayerUiPerfMonitorContext = createContext<PlayerUiPerfMonitorContextType | undefined>(undefined);

interface PlayerUiPerfMonitorProps {
  children: ReactNode;
}

/**
 * This provider is used to give a PlayerUiPerfMonitor instance to the component tree.
 * It is intended to be used in an HOC very close to the application root. But,
 * the playerUiPerformanceMonitor is not needed on all pages-- only on player
 * pages. For this reason, the context is not always defined; the playerUiPerfMonitor
 * is only set up when the developer calls`useInitializePlayerUiPerfMonitor`.
 */
export const PlayerUiPerfMonitorProvider = ({ children }: PlayerUiPerfMonitorProps) => {
  const state = useState<PlayerUiPerfMonitor | undefined>(undefined);
  return <PlayerUiPerfMonitorContext.Provider value={state}>{children}</PlayerUiPerfMonitorContext.Provider>;
};
