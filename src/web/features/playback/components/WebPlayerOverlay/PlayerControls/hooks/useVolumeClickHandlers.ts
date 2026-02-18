import { useCallback } from 'react';
import type { MutableRefObject } from 'react';

import useLatest from 'common/hooks/useLatest';

export interface UseVolumeClickHandlersProps {
  volumeChangedByUserRef: MutableRefObject<boolean>;
  volumeMuteChangedByUserRef: MutableRefObject<boolean>;
  isMuted: boolean;
  setVolume: (props: { volume: number }) => void;
  toggleVolumeMute: () => void;
}

export const useVolumeClickHandlers = ({
  volumeChangedByUserRef,
  volumeMuteChangedByUserRef,
  isMuted,
  setVolume,
  toggleVolumeMute,
}: UseVolumeClickHandlersProps) => {
  const isMutedRef = useLatest(isMuted);
  const setVolumeRef = useLatest(setVolume);
  const toggleVolumeMuteRef = useLatest(toggleVolumeMute);

  const handleClickVolume = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    volumeMuteChangedByUserRef.current = true;
    toggleVolumeMuteRef.current();
  }, [volumeMuteChangedByUserRef, toggleVolumeMuteRef]);

  const updateVolume = useCallback((value: number) => {
    volumeChangedByUserRef.current = true;
    if (isMutedRef.current) {
      volumeMuteChangedByUserRef.current = true;
    }
    setVolumeRef.current({ volume: value });
  }, [volumeChangedByUserRef, volumeMuteChangedByUserRef, isMutedRef, setVolumeRef]);

  return {
    handleClickVolume,
    updateVolume,
  };
};
