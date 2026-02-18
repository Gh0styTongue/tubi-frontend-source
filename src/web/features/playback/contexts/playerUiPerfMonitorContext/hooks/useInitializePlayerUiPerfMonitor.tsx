import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import type { PlayerType } from 'client/features/playback/track/client-log';
import { trackPlayerUiPerf } from 'client/features/playback/track/client-log/trackPlayerUiPerf';
import { exposeToTubiGlobal } from 'client/global';
import type { CleanupFn } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import { useIsomorphicLayoutEffect } from 'common/hooks/useIsomorphicLayoutEffect';
import useLatest from 'common/hooks/useLatest';
import { PlayerUiPerfMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/monitor/playerUiPerfMonitor';
import { PlayerUiPerfMonitorContext } from 'web/features/playback/contexts/playerUiPerfMonitorContext/playerUiPerfMonitorContext';
import { getShouldCollect } from 'web/features/playback/contexts/playerUiPerfMonitorContext/utils/getShouldCollect';

/**
 * Intended to be called in a single component close to the root on pages where
 * we wish to make use of the performance monitor-- must be called within or
 * above the top-level component whose behavior we wish to monitor using the
 * performance monitor.
 *
 * Note that this hook is intended to be called only once in the component tree!
 *
 * We need the content ID to detect navigations from one page
 * to another in cases where the calling component does not
 * unmount and remount when doing this (e.g. web)
 */
export const useInitializePlayerUiPerfMonitor = (contentId: string, playerType: PlayerType = 'v' as PlayerType): PlayerUiPerfMonitor | undefined => {
  const value = useContext(PlayerUiPerfMonitorContext);
  if (!value) {
    throw new Error('useInitializePlayerUiPerfMonitor must be used within a PlayerUiPerfMonitorProvider');
  }
  const [monitor, setMonitor] = value;

  // Using a ref here helps us ensure that we can access the monitor before
  // the setState in the context is done executing (since setState is effectively
  // async)
  const monitorRef = useLatest(monitor);

  // Do a dice roll / check feat flags to determine if we should initialize
  // the monitor for this playback session
  const shouldInitialize = useMemo(() => getShouldCollect(playerType), [playerType]);

  const playerContext = usePlayerContext();
  const cleanupRef = useRef<CleanupFn | void>();

  // Setup the monitor if we passed the check. Intended to do this just once.
  // useLayoutEffect is necessary to ensure this runs prior to player setup
  // (see below)
  useIsomorphicLayoutEffect(() => {
    if (!monitor && shouldInitialize) {
      const playerUiPerfMonitor = new PlayerUiPerfMonitor(playerType);
      setMonitor(playerUiPerfMonitor);
      monitorRef.current = playerUiPerfMonitor;
      exposeToTubiGlobal({ playerUiPerfMonitor });

      // If the player already exists, at this point, we can
      // subscribe to it. This ensures we always inject the player
      // in scenarios where the component re-renders with a new
      // contentId, like web YMAL or autoplay
      if (playerContext.player) {
        cleanupRef.current?.();
        cleanupRef.current = monitorRef.current.onPlayerCreate(playerContext.player, playerContext.managers);
      }
    }
  }, [
    monitor,
    setMonitor,
    shouldInitialize,
    monitorRef,
    playerContext,
    // not used in the effect but intentionally passed to ensure
    // we re-run when navigating between content
    contentId,
    playerType,
  ]);

  // Potentially set up anything that needs the player in the monitor,
  // if we passed our check.
  //
  // This is separate from initializing the perf monitor as a whole because
  // we don't want to wait until the player has been created to start monitoring
  // UI performance.
  useOnPlayerCreate(useCallback((player, managers) => {
    // untestable type guard
    // istanbul ignore next
    if (!monitorRef.current) return;

    // we may have injected the player when setting up the monitor
    // (web autoplay/YMAL navigation). If so we do not want to
    // have duplicate subscriptions, so we clean up first
    cleanupRef.current?.();

    // inject player/managers to performance monitor
    return monitorRef.current.onPlayerCreate(player, managers);
  // We intentionally want to regenerate this when content changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, monitorRef]));

  // When unmounting, send up our logs
  useEffect(() => {
    return () => {
      if (!monitorRef.current) return;
      trackPlayerUiPerf(monitorRef.current.getStats());

      // Marks the monitor for GC, unsuring that if we remount
      // a player page we get a fresh monitor
      setMonitor(undefined);
      monitorRef.current = undefined;
    };
    // intentionally run ONLY on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  // Returned only for testing; there is generally no good reason for the
  // caller to consume a reference to the monitor here. We should prefer
  // `usePlayerUiPerfMonitor` instead.
  return monitor;
};

