import type { AudioTrackInfo, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

import { getLocalData, setLocalData } from 'client/utils/localDataStorage';
import { WEB_AUDIO_TRACK_SELECT, AUDIO_SELECT_EXPIRE_TIME } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { buildAudioTrackToggleEventObject } from 'common/utils/analytics';
import { getLanguageCodeFromAudioTrack, internationalizeAudioLabels, isDescriptionTrack } from 'common/utils/audioTracks';
import { trackEvent } from 'common/utils/track';

interface UseAudioTracksParams {
  contentId: string
}

export const useAudioTracks = ({ contentId }: UseAudioTracksParams) => {
  const playerRef = useRef<InstanceType<typeof Player> | null>(null);
  const userId = useAppSelector(userIdSelector);
  const intl = useIntl();

  const getAudioTracks = useCallback(() => {
    return internationalizeAudioLabels(playerRef.current?.getAudioTracks() || [], intl);
  }, [playerRef, intl]);

  const setAudioTrack = useCallback((idx: number): Promise<AudioTrackInfo> => {
    return new Promise((resolve, reject) => {
      const selectedTrack = getAudioTracks().find(audioTrack => audioTrack.id === idx);
      if (!selectedTrack) return reject('no selected audio track');
      const code = getLanguageCodeFromAudioTrack(selectedTrack);
      const descriptionsEnabled = isDescriptionTrack(selectedTrack);
      const audioTrackEvent = buildAudioTrackToggleEventObject(
        contentId,
        code,
        descriptionsEnabled,
      );
      trackEvent(eventTypes.AUDIO_SELECTION, audioTrackEvent);
      setLocalData(WEB_AUDIO_TRACK_SELECT, selectedTrack.label, !userId ? AUDIO_SELECT_EXPIRE_TIME : undefined);
      playerRef.current?.setAudioTrack(selectedTrack);
      resolve(selectedTrack);
    });
  }, [playerRef, getAudioTracks, contentId, userId]);

  const getCurrentAudioTrack = useCallback(() => {
    return playerRef.current?.getCurrentAudioTrack();
  }, [playerRef]);

  const onAudioTracksAvailable = useCallback((audioTracks: AudioTrackInfo[]) => {
    const languageCode = intl.locale.split('-')[0];
    const audioTrackSavedRole = getLocalData(WEB_AUDIO_TRACK_SELECT);

    let audioTrackSaved: AudioTrackInfo | undefined;
    if (audioTrackSavedRole) {
      audioTrackSaved = audioTracks.find(audioTrack => audioTrack.label === audioTrackSavedRole);
    }
    if (!audioTrackSaved && languageCode) {
      audioTrackSaved = audioTracks.find(audioTrack => getLanguageCodeFromAudioTrack(audioTrack) === languageCode.toUpperCase() && audioTrack.role === 'main');
    }
    if (audioTrackSaved) {
      setAudioTrack(audioTrackSaved.id);
    }
  }, [setAudioTrack, intl]);

  const setupAudioEvents = useCallback((player: InstanceType<typeof Player>) => {
    playerRef.current?.off(PLAYER_EVENTS.audioTracksAvailable, onAudioTracksAvailable);
    playerRef.current = player;
    player.on(PLAYER_EVENTS.audioTracksAvailable, onAudioTracksAvailable);
  }, [onAudioTracksAvailable]);

  useEffect(() => {
    // note this only runs if setupAudioEvents has already been called...
    playerRef.current?.on(PLAYER_EVENTS.audioTracksAvailable, onAudioTracksAvailable);
    return () => {
      playerRef.current?.off(PLAYER_EVENTS.audioTracksAvailable, onAudioTracksAvailable);
    };
  }, [onAudioTracksAvailable]);

  return {
    setAudioTrack,
    getAudioTracks,
    getCurrentAudioTrack,
    setupAudioEvents,
  };
};
