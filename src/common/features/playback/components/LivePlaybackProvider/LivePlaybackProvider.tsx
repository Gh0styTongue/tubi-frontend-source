import noop from 'lodash/noop';
import type { FC, PropsWithChildren } from 'react';
import React, { useCallback, createContext, useContext, useRef } from 'react';

import type { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import type { LivePlayerWrapper } from 'src/client/features/playback/live/LivePlayerWrapper';

interface LivePlaybackContextProps {
  value: {
    player?: LivePlayerWrapper;
    qualityManager?: LivePlaybackQualityManager;
  };
  update: (newValue: Partial<LivePlaybackContextProps['value']>) => void;
}

const defaultValue = {
  value: {
    player: undefined,
    qualityManager: undefined,
  },
  update: noop,
};

const LivePlaybackContext = createContext<LivePlaybackContextProps>(defaultValue);

export const useLivePlaybackContext = () => useContext(LivePlaybackContext);

export const LivePlaybackProvider: FC<PropsWithChildren> = ({ children }) => {
  const livePlaybackContextRef = useRef<LivePlaybackContextProps>(defaultValue);
  const updateCallback = useCallback((newValue: Partial<LivePlaybackContextProps['value']>) => {
    livePlaybackContextRef.current.value = {
      ...livePlaybackContextRef.current.value,
      ...newValue,
    };
  }, [livePlaybackContextRef]);
  livePlaybackContextRef.current.update = updateCallback;

  return <LivePlaybackContext.Provider value={livePlaybackContextRef.current}>
    {children}
  </LivePlaybackContext.Provider>;
};
