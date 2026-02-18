import { PLAYER_EVENTS, getPlayerAdProgress, getPlayerProgress } from '@adrise/player';
import { useCallback, useRef, useState } from 'react';

import { useExperiment } from 'common/experimentV2';
import OTTPlayerNoReduxAdProgress from 'common/experimentV2/configs/ottPlayerNoReduxAdProgress';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import useAppSelector from 'common/hooks/useAppSelector';
import { isControlsVisibleSelector } from 'common/selectors/playerUI';
import type { StoreState } from 'common/types/storeState';

export function playerProgress() {
  return getPlayerProgress();
}

function adProgressSelector(state: StoreState) {
  return state.player.adProgress;
}

function adPositionSelector(state: StoreState) {
  return state.player.adProgress.position;
}

export function useAdProgressSubscription() {
  const [progress, setProgress] = useState(getPlayerAdProgress());
  const useReduxState = useExperiment(OTTPlayerNoReduxAdProgress).get('use_redux_state');
  usePlayerEvent(PLAYER_EVENTS.adProgress, useCallback((progress) => setProgress({ ...progress }), []), { disable: useReduxState });
  const reduxProgress = useAppSelector(adProgressSelector);
  return useReduxState ? reduxProgress : progress;
}

export function usePositionSubscription() {
  const [position, setProgress] = useState(getPlayerProgress().position);
  usePlayerEvent(PLAYER_EVENTS.progress, useCallback((progress) => setProgress(progress.position), []));
  return position;
}

export function useProgressSubscription() {
  const [progress, setProgress] = useState(getPlayerProgress());
  usePlayerEvent(PLAYER_EVENTS.progress, useCallback((progress) => setProgress({ ...progress }), []));
  return progress;
}

export function useControlsVisibleAdPosition() {
  const reduxControlsVisibleAdPosition = useAppSelector((state) => isControlsVisibleSelector(state) ? adPositionSelector(state) : undefined);
  const useReduxState = useExperiment(OTTPlayerNoReduxAdProgress).get('use_redux_state');
  const isControlsVisible = reduxControlsVisibleAdPosition !== undefined;
  const [position, setPosition] = useState(getPlayerAdProgress().position);
  const latestPositionRef = useRef(0);
  usePlayerEvent(
    PLAYER_EVENTS.adProgress,
    useCallback((progress) => setPosition(progress.position), []),
    { disable: useReduxState || !isControlsVisible },
  );

  if (isControlsVisible) {
    latestPositionRef.current = useReduxState ? reduxControlsVisibleAdPosition : position;
  }

  return latestPositionRef.current;
}

export function useControlsVisiblePositionSubscription() {
  const isControlsVisible = useAppSelector(isControlsVisibleSelector);
  const [position, setPosition] = useState(getPlayerProgress().position);
  const latestPositionRef = useRef(0);
  usePlayerEvent(
    PLAYER_EVENTS.progress,
    useCallback((progress) => setPosition(progress.position), []),
    { disable: !isControlsVisible },
  );

  if (isControlsVisible) {
    latestPositionRef.current = position;
  }

  return latestPositionRef.current;
}
