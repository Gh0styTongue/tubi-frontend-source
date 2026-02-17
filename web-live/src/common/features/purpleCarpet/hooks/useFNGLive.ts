import { isInProgress, secs } from '@adrise/utils/lib/time';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { noop } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { exposeToTubiGlobal } from 'client/global';
import { purpleCarpetScriptsPrefix } from 'common/apiConfig';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import { setLiveLoading, setLivePlayerReadyState } from 'common/features/playback/actions/live';
import { useTrackFoxLiveEvent } from 'common/features/playback/hooks/useTrackFoxLiveEvent';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { getDebugLog } from 'common/utils/debug';
import { loadScript } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { matchesRoute } from 'common/utils/urlPredicates';
import { platform } from 'src/config';

import getAppId from './getAppId';
import useFoxLiveLog from './useFoxLiveLog';
import { loadListing } from '../action';
import { isPurpleCarpetDeportesSelector, isPurpleCarpetSupportedSelector } from '../selector';
import type { WPFPlayer } from '../type';

const API_KEY = `tubi_${platform}`;
interface ListingItem {
  id: string;
  tubi_id: string;
  startDate: string;
  endDate: string;
  network: string;
  background: string;
}
const debugLog = getDebugLog('fox_live');
export const useListingData = (listingData: ListingItem[], contentId: string, isDeportesId: boolean = false) => {
  const [listing, setListing] = useState({
    currentProgram: undefined as ListingItem | undefined,
    refresh: noop,
    listing: [] as ListingItem[],
  });
  const inProgressContentRef = useRef<ListingItem | undefined>(undefined);

  const dispatch = useAppDispatch();
  const [_, setCurrentProgram] = useState<ListingItem | undefined>(undefined);

  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const inProgressContents = listingData.filter((item: ListingItem) => isInProgress(item.startDate, item.endDate, currentDate));

  if (isDeportesId) {
    inProgressContentRef.current = inProgressContents.find((item) => item.tubi_id === contentId && item.network === 'foxdep');
  } else if (inProgressContents.length === 1 && inProgressContents[0].network !== 'foxdep') {
    inProgressContentRef.current = inProgressContents[0];
  } else if (inProgressContents.length > 1) {
    inProgressContentRef.current = inProgressContents.find((item) => item.tubi_id === contentId && item.network !== 'foxdep') || inProgressContents.find(item => item.network !== 'foxdep');
  }

  const fetchListing = useCallback(() => {
    return dispatch(loadListing(true));
  }, [dispatch]);

  useEffect(() => {
    setListing({
      refresh: fetchListing,
      currentProgram: inProgressContentRef.current,
      listing: listingData,
    });

    setCurrentProgram(inProgressContentRef.current);

  }, [fetchListing, inProgressContentRef, listingData]);

  useEffect(() => {
    if (!inProgressContentRef.current && listingData.length === 0) {
      fetchListing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return listing;
};
const useLive = ({
  contentId,
  shouldStartOTTPlayer = true,
}: {
  contentId: string;
  shouldStartOTTPlayer?: boolean;
}) => {
  const [foxPlayer, setPlayer] = useState<WPFPlayer | null>(null);
  const isPurpleCarpetSupported = useAppSelector(isPurpleCarpetSupportedSelector);
  const foxPlayerRef = useRef<WPFPlayer | null>(null);
  const dispatch = useDispatch();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const isDeportesId = useAppSelector((state) => isPurpleCarpetDeportesSelector(state, contentId));
  const listingData = useAppSelector((state) => state.purpleCarpet.listing);
  const listing = useListingData(listingData, contentId, isDeportesId);
  const [fatalError, setFatalError] = useState(false);
  const [_, setMediaStarted] = useState(false);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [currentTubiId, setCurrentTubiId] = useState(listing.currentProgram?.tubi_id || '');
  const eventExitRedirectTimer = useRef<ReturnType<typeof setTimeout>>();
  const { addLog } = useFoxLiveLog();
  const scriptLoadedRef = useRef({
    loaded: false,
    promise: undefined as Promise<void> | undefined,
  });
  const [forceReloadCount, setForceReloadCount] = useState(0);

  const userId = useAppSelector(userIdSelector);
  const deviceId = useAppSelector(deviceIdSelector);

  const liveEventListeners = useTrackFoxLiveEvent({
    videoPlayer: PlayerDisplayMode.DEFAULT,
    id: currentTubiId,
  });

  const foxPlayerListeners = useRef({
    onMediaStart: noop,
    onPlay: noop,
    onMediaPlaying: noop,
    onPlayerError: noop,
    onReady: noop,
    onLiveEnd: noop,
    onSourceLoaded: noop,
    onPlaybackStart: noop,
  });

  const onPlayerError = useCallback(() => {
    setFatalError(true);
  }, [setFatalError]);

  const onReady = useCallback(() => {
    dispatch(setLivePlayerReadyState(true));
    setMediaStarted(true);
  }, [dispatch]);

  const onLiveEnd = useCallback(() => {
    // Wait for 60 seconds before redirecting to home page.
    eventExitRedirectTimer.current = setTimeout(() => {
      // Live ended, navigate to home page.
      if (__WEBPLATFORM__) {
        tubiHistory.replace(WEB_ROUTES.home);
      } else {
        tubiHistory.replace(OTT_ROUTES.home);
      }
    }, secs(60));
  }, []);

  const onSourceLoaded = useCallback(() => {
    setLiveLoading(false);
    setSourceLoaded(true);
  }, []);

  const onPlaybackStart = useCallback((id: string) => {
    if (!id) {
      return;
    }
    const idToTubiIdMap = new Map(listingData.map(item => [item.id, item.tubi_id]));
    const newTubiId = idToTubiIdMap.get(id);
    if (newTubiId && newTubiId !== currentTubiId) {
      setCurrentTubiId(newTubiId);
      liveEventListeners.current.onLiveStart(newTubiId);
    }

  }, [listingData, currentTubiId, liveEventListeners]);

  useEffect(() => {
    foxPlayerListeners.current.onPlayerError = onPlayerError;
    foxPlayerListeners.current.onReady = onReady;
    foxPlayerListeners.current.onLiveEnd = onLiveEnd;
    foxPlayerListeners.current.onSourceLoaded = onSourceLoaded;
    foxPlayerListeners.current.onPlaybackStart = onPlaybackStart;
  }, [onPlayerError, onReady, onLiveEnd, onSourceLoaded, onPlaybackStart]);

  useEffect(() => {
    const loadFNGScript = async () => {
      if (!scriptLoadedRef.current.promise && !window?.wpf?.player?.WPFPlayer) {
        scriptLoadedRef.current.promise = loadScript(`${purpleCarpetScriptsPrefix}/wpf_player.js`);
      }
      try {
        await scriptLoadedRef.current.promise;
        debugLog('player script is loaded');
        addLog('player script is loaded');
        scriptLoadedRef.current.loaded = true;
      } catch (error) {
        scriptLoadedRef.current.loaded = false;
      }
    };
    if (!isPurpleCarpetSupported) {
      return;
    }
    loadFNGScript();
  }, [addLog, isPurpleCarpetSupported]);

  useEffect(() => {
    if (listing.listing.length && !listing.currentProgram) {
      setFatalError(true);
    }
    setCurrentTubiId(listing.currentProgram?.tubi_id || '');
  }, [listing.currentProgram, listing.listing.length]);

  const buildPlayer = useCallback(async () => {
    if (!playerRef.current || !listing.currentProgram || !shouldStartOTTPlayer) {
      debugLog('playerRef.current or currentProgram is not ready', { playerRef: playerRef.current, currentProgram: listing.currentProgram });
      addLog('playerRef.current or currentProgram is not ready');
      return;
    }

    const pathname = getCurrentPathname();
    if (matchesRoute(OTT_ROUTES.home, pathname)) {
      // already back to home page
      return;
    }

    debugLog('playerRef.current and listing is ready');
    addLog('playerRef.current and listing is ready');
    if (!scriptLoadedRef.current.loaded) {
      debugLog('build player but script is not loaded');
      addLog('build player but script is not loaded');
      await scriptLoadedRef.current.promise;
    }
    if (!window?.wpf) {
      debugLog('script loaded but window.wpf is not ready');
      addLog('script loaded but window.wpf is not ready');
      return;
    }

    // Remove existing player if it exists
    if (foxPlayerRef.current) {
      addLog('remove existing player');
      debugLog('remove existing player');
      await foxPlayerRef.current.removePlayer();
    }

    try {
      const Player = window?.wpf?.player?.WPFPlayer;

      const source = {
        watch: {
          streamId: listing.currentProgram?.id,
          streamType: 'live',
        },
        auth: {
          profile: {
            accessToken: '',
            profileId: String(userId || deviceId),
          },
        },
      };
      const config = {
        id: listing.currentProgram?.id,
        appId: getAppId(),
        autoplay: true,
        env: 'prod',
        controlsConfig: {
          inactivityDuration: 0,
        },
        mute: !!__WEBPLATFORM__,
        mediaInfo: {},
        watch: {},
        auth: {},
        allowPiP: false,
        width: '100%',
        height: '100%',
        mode: 'live',
        controls: false,
        isLive: true,
        profiles: [
          {
            tweaks: {
              file_protocol: 'true',
              app_id: getAppId(),
            },
            useProfileFor: 'live',
          },
        ],
        restart: false,
        listeners: {
          Play: /* istanbul ignore next */ () => {
            if (listing.currentProgram) {
              liveEventListeners.current.onLiveStart(listing.currentProgram.tubi_id);
            }
          },
          Progress: /* istanbul ignore next */ (e: any) => {
            addLog('MediaPlaying');
            setFatalError(false);
            liveEventListeners.current.onLiveProgress(e);
          },
          PlayerError: /* istanbul ignore next */ () => {
            addLog('PlayerError');
            foxPlayerListeners.current.onPlayerError();
          },
          Ready: /* istanbul ignore next */ () => {
            foxPlayerListeners.current.onReady();
          },
          SourceLoaded: /* istanbul ignore next */ () => {
            foxPlayerListeners.current.onSourceLoaded();
          },
          ExitEventStream: /* istanbul ignore next */ (e: any) => {
            foxPlayerListeners.current.onLiveEnd(e);
            addLog('ExitEventStream');
          },
          PlaybackStart: /* istanbul ignore next */ (e: any) => {
            addLog('PlaybackStart');
            // For 3.2.4 we will receive empty assetInfo, so add a defensive check
            foxPlayerListeners.current.onPlaybackStart(e.assetInfo?.id || '');
          },
        },
      };
      const conf = {
        player: config,
        source,
        ads: {
          publisherId: deviceId,
        },
        api: {
          key: API_KEY === 'tubi_tizen' ? 'tubi_samsung' : API_KEY,
          videoBaseUrl: 'https://prod.api.haw.digitalvideoplatform.com/v3.0',
        },
        services: {},
      };

      const player = new Player(playerRef.current, conf);
      debugLog('player is ready');
      addLog('player is ready');
      player.load();
      setPlayer(player);
      foxPlayerRef.current = player;

      exposeToTubiGlobal({ fngPlayer: player });
    } catch (error) {
      debugLog('error building player', { error });
      addLog('error building player');
    }
  }, [addLog, deviceId, listing.currentProgram, liveEventListeners, shouldStartOTTPlayer, userId]);

  useEffect(() => {
    buildPlayer();
  }, [
    buildPlayer,
    forceReloadCount,
  ]);

  useEffect(() => {
    // bypass the eslint warning the exhaustive-deps
    const liveEvents = liveEventListeners;
    return () => {
      clearTimeout(eventExitRedirectTimer.current);
      if (foxPlayerRef.current) {
        try {
          foxPlayerRef.current.removePlayer();
        } catch (error) {
          debugLog('error removing player', { error });
          addLog('error removing player');
        }
      }
      liveEvents.current.onLiveProgressFlush();
    };
  }, [addLog, liveEventListeners]);

  const reload = useCallback(() => {
    setFatalError(false);
    setForceReloadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    exposeToTubiGlobal({ reloadFNGPlayer: reload });
  }, [reload]);

  return {
    player: foxPlayer,
    playerRef,
    fatalError,
    setFatalError,
    reload,
    onReady,
    onPlayerError,
    onLiveEnd,
    sourceLoaded,
    onSourceLoaded,
    currentProgram: listing.currentProgram,
    onPlaybackStart,
  };
};

export default useLive;
