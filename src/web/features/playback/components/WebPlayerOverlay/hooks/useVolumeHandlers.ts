import { useCallback, useEffect, useState } from 'react';

import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import useLatest from 'common/hooks/useLatest';

interface UseVolumeHandlersProps {
  refreshActiveTimer: () => void;
}

type VolumeProps = { volume?: number, isMuted?: boolean };

export type SetVolumeFn = ({ volume, isMuted }: VolumeProps) => void;

export const useVolumeHandlers = ({
  refreshActiveTimer,
}: UseVolumeHandlersProps) => {
  const refreshActiveTimerRef = useLatest(refreshActiveTimer);
  const { getPlayerInstance } = useGetPlayerInstance();

  // Local state for volume and mute
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);

  // Update volume state
  const updateVolumeState = useCallback((newVolume?: number, newMuted?: boolean) => {
    if (newVolume !== undefined) {
      setVolumeState(newVolume);
    }
    if (newMuted !== undefined) {
      setIsMuted(newMuted);
    }
  }, []);

  // Toggle mute state
  const toggleMutedState = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  useEffect(() => {
    const instance = getPlayerInstance();
    if (typeof instance === 'undefined') return;
    // align player volume to the local state
    updateVolumeState(instance.getVolume(), instance.getMute());
  }, [getPlayerInstance, updateVolumeState]);

  const setPlayerVolume = useCallback(({ volume, isMuted }: VolumeProps) => {
    const instance = getPlayerInstance();
    if (typeof instance === 'undefined') return;
    if (typeof volume !== 'undefined') {
      instance.setVolume(volume);
    }
    if (typeof isMuted !== 'undefined') {
      instance.setMute(!!isMuted);
    }
  }, [getPlayerInstance]);

  const setVolume: SetVolumeFn = useCallback(({ volume, isMuted }: VolumeProps) => {
    setPlayerVolume({ volume, isMuted });
    refreshActiveTimerRef.current();
    updateVolumeState(volume, isMuted);
  }, [refreshActiveTimerRef, updateVolumeState, setPlayerVolume]);

  const toggleVolumeMute = useCallback(() => {
    setPlayerVolume({ isMuted: !isMuted });
    toggleMutedState();
  }, [toggleMutedState, setPlayerVolume, isMuted]);

  return {
    setVolume,
    toggleVolumeMute,
    volume,
    isMuted,
  };
};
