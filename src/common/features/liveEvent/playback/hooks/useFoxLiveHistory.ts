import { secs } from '@adrise/utils/lib/time';
import { useCallback, useEffect, useRef } from 'react';

import { add as addToHistory } from 'common/actions/history';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { specialEventCWInitJitterSelector, specialEventCWPostIntervalSelector } from 'common/selectors/remoteConfig';

type LiveProgressEvent = { time?: number } | any;

/**
 * Hook for writing progress to History when FOX live transitions into a specific VOD title.
 * - Starts after onLiveStart when the live asset maps to targetTubiId
 * - Captures position from onLiveProgress(e.time)
 * - Posts initially after a random jitter up to 3 minutes, then every 3 minutes
 * - Flushes once on teardown
 */
export const useFoxLiveHistory = () => {
  const dispatch = useAppDispatch();

  const jitterSeconds = useAppSelector(specialEventCWInitJitterSelector);
  const postIntervalSeconds = useAppSelector(specialEventCWPostIntervalSelector);

  const historyIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const initialJitterTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastLivePositionRef = useRef<number>(0);
  const lastProgressEventTimeMsRef = useRef<number | undefined>(undefined);
  const activeTubiIdRef = useRef<string | undefined>(undefined);
  const parentIdRef = useRef<string | undefined>(undefined);

  const clearHistoryTimers = useCallback(() => {
    if (initialJitterTimeoutRef.current) {
      clearTimeout(initialJitterTimeoutRef.current);
      initialJitterTimeoutRef.current = undefined;
    }
    if (historyIntervalRef.current) {
      clearInterval(historyIntervalRef.current);
      historyIntervalRef.current = undefined;
    }
  }, []);

  const fireHistoryAdd = useCallback(() => {
    const tubiId = activeTubiIdRef.current;
    if (!tubiId) return;

    const position = Math.floor(lastLivePositionRef.current || 0);
    if (position <= 0) return;
    dispatch(addToHistory({
      contentId: tubiId,
      contentType: parentIdRef.current ? 'episode' : 'movie',
      parentId: parentIdRef.current,
      position,
      location: tubiHistory.getCurrentLocation(),
    }));
  }, [dispatch, parentIdRef]);

  const startHistoryPosting = useCallback(() => {
    if (historyIntervalRef.current || initialJitterTimeoutRef.current) return;

    // One-time initial jitter up to remote-configured seconds
    const jitterMs = Math.floor(Math.random() * secs(Math.max(0, jitterSeconds)));
    initialJitterTimeoutRef.current = setTimeout(() => {
      fireHistoryAdd();
      historyIntervalRef.current = setInterval(() => {
        fireHistoryAdd();
      }, secs(Math.max(0, postIntervalSeconds)));
    }, jitterMs);
  }, [fireHistoryAdd, jitterSeconds, postIntervalSeconds]);

  useEffect(() => {
    return () => {
      clearHistoryTimers();
      activeTubiIdRef.current = undefined;
    };
  }, [clearHistoryTimers]);

  const onLiveStart = useCallback((tubiId: string, parentId: string | undefined) => {
    if (!tubiId) return;

    if (activeTubiIdRef.current === tubiId) return;

    // Clear old timers before starting new ones to prevent timer leak
    clearHistoryTimers();

    activeTubiIdRef.current = tubiId;
    parentIdRef.current = parentId;
    lastLivePositionRef.current = 0;
    lastProgressEventTimeMsRef.current = undefined;
    startHistoryPosting();
  }, [startHistoryPosting, clearHistoryTimers]);

  const onLiveProgress = useCallback((e: LiveProgressEvent) => {
    if (!activeTubiIdRef.current) return;
    if (typeof e?.time !== 'number') return;

    const previousEventTimeMs = lastProgressEventTimeMsRef.current;

    if (previousEventTimeMs === undefined) {
      lastProgressEventTimeMsRef.current = e.time;
      return;
    }

    const delta = e.time - previousEventTimeMs;
    if (delta <= 0) return;

    lastLivePositionRef.current += delta;
    lastProgressEventTimeMsRef.current = e.time;
  }, []);

  const onLiveProgressFlush = useCallback(() => {
    fireHistoryAdd();
    clearHistoryTimers();
  }, [fireHistoryAdd, clearHistoryTimers]);

  const onLiveStop = useCallback(() => {
    clearHistoryTimers();
    activeTubiIdRef.current = undefined;
  }, [clearHistoryTimers]);

  const listenersRef = useRef({
    onLiveStart: (_tubiId: string, _parentId?: string) => {},
    onLiveProgress: (_e: LiveProgressEvent) => {},
    onLiveProgressFlush: () => {},
    onLiveStop: () => {},
  });

  listenersRef.current = {
    onLiveStart,
    onLiveProgress,
    onLiveProgressFlush,
    onLiveStop,
  };

  return listenersRef;
};
