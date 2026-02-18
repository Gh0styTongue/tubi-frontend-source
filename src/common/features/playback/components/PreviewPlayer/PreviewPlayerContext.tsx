import type { FC, PropsWithChildren } from 'react';
import React, { useContext, createContext, useMemo, useState } from 'react';

import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import useIsLivePlaying from 'common/features/playback/hooks/useIsLivePlaying';
import useIsVODPlaying from 'common/features/playback/hooks/useIsVODPlaying';

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PreviewPlayerContextType = {
  position: Position | null,
  setPosition:(position: Position | null) => void,
  isPlaying: boolean;
};

export const PreviewPlayerContext = createContext<PreviewPlayerContextType>({
  position: null,
  setPosition: FREEZED_EMPTY_FUNCTION,
  isPlaying: false,
});

export const PreviewPlayerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const isVODPlaying = useIsVODPlaying();
  const isLivePlaying = useIsLivePlaying();
  const isPlaying = isVODPlaying || isLivePlaying;

  const value = useMemo(() => ({
    position,
    setPosition,
    isPlaying,
  }), [position, isPlaying]);

  return <PreviewPlayerContext.Provider value={value}>{children}</PreviewPlayerContext.Provider>;
};

export const usePreviewPlayerContext = () => useContext(PreviewPlayerContext);
