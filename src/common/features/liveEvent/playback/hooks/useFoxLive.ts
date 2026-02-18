import { isInProgress, secs } from '@adrise/utils/lib/time';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { noop } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { exposeToTubiGlobal } from 'client/global';
import systemApi from 'client/systemApi';
import { FREEZED_EMPTY_ARRAY, US_PRIVACY_STRING_OPT_IN } from 'common/constants/constants';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { userIdSelector } from 'common/features/authentication/selectors/auth';
import getAppId from 'common/features/liveEvent/playback/hooks/getAppId';
import type { WPFPlayer } from 'common/features/liveEvent/playback/hooks/types';
import { useFoxLiveHistory } from 'common/features/liveEvent/playback/hooks/useFoxLiveHistory';
import useFoxLiveLog from 'common/features/liveEvent/playback/hooks/useFoxLiveLog';
import { useTrackFoxLiveEvent } from 'common/features/liveEvent/playback/hooks/useTrackFoxLiveEvent';
import useForceHideRestartBtn from 'common/features/liveEvent/playback/useForceHideRestartBtn';
import { setLiveLoading, setLivePlayerReadyState } from 'common/features/playback/actions/live';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { usPrivacyStringSelector } from 'common/selectors/userSettings';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiAd } from 'common/utils/analytics';
import { getDebugLog } from 'common/utils/debug';
import { loadScript } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { matchesRoute } from 'common/utils/urlPredicates';
import { platform } from 'src/config';

import { useLiveEventListing } from './useLiveEventListing';

const liveEventScriptsPrefix = 'https://prod.player.fox.digitalvideoplatform.com/wpf/v3/3.2.53';
const API_KEY = `tubi_${platform}`;
export interface ListingItem {
  id: string;
  tubi_id: string;
  startDate: string;
  endDate: string;
  network: string;
  background: string;
  enable_watch_history?: boolean;
  parent_id?: string;
}

type IdToListingItemMap = Map<string, {
  tubi_id: string;
  parent_id: string | undefined;
  enable_watch_history: boolean | undefined;
}>;

const debugLog = getDebugLog('fox_live');
const useListingData = (listingData: ListingItem[], contentId: string, refetch: () => void) => {
  const [listing, setListing] = useState({
    currentProgram: undefined as ListingItem | undefined,
    refresh: noop,
    listing: [] as ListingItem[],
  });
  const inProgressContentRef = useRef<ListingItem | undefined>(undefined);

  // const dispatch = useAppDispatch();
  const [_, setCurrentProgram] = useState<ListingItem | undefined>(undefined);

  const currentDate = useCurrentDate();
  const inProgressContents = listingData.filter((item: ListingItem) => isInProgress(item.startDate, item.endDate, currentDate));

  if (inProgressContents.length > 0) {
    inProgressContentRef.current = inProgressContents.find((item) => item.tubi_id === contentId) || inProgressContents[0];
  }

  // No refresh/fetch here; listing is fetched once by react-query
  const fetchListing = useCallback(() => {
    return refetch();
  }, [refetch]);

  useEffect(() => {
    setListing({
      refresh: fetchListing,
      currentProgram: inProgressContentRef.current,
      listing: listingData,
    });

    setCurrentProgram(inProgressContentRef.current);

  }, [fetchListing, inProgressContentRef, listingData]);

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
  const playingAdRef = useLatest<TubiAd & { sequence: number } | undefined>(undefined);
  const foxPlayerRef = useRef<WPFPlayer | null>(null);
  const dispatch = useDispatch();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const { data: listingData = FREEZED_EMPTY_ARRAY, refetch } = useLiveEventListing();
  const listing = useListingData(listingData as ListingItem[], contentId, refetch);
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

  useForceHideRestartBtn();
  const redirectJitterSec = useAppSelector((state) => state.remoteConfig.special_event_redirect_homepage_jitter ?? 60);
  const usPrivacyString = useAppSelector(usPrivacyStringSelector);

  const liveEventListeners = useTrackFoxLiveEvent({
    videoPlayer: PlayerDisplayMode.DEFAULT,
    id: currentTubiId,
  });
  const historyListeners = useFoxLiveHistory();

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
    const delaySec = Math.floor(Math.random() * Math.max(redirectJitterSec, 0));
    addLog(`Redirecting to home after ${delaySec}s`);
    // Wait for randomized seconds before redirecting to home page.
    eventExitRedirectTimer.current = setTimeout(() => {
      // Live ended, navigate to home page.
      if (__WEBPLATFORM__) {
        tubiHistory.replace(WEB_ROUTES.home);
      } else {
        tubiHistory.replace(OTT_ROUTES.home);
      }
    }, secs(delaySec));
  }, [redirectJitterSec, addLog]);

  const onSourceLoaded = useCallback(() => {
    setLiveLoading(false);
    setSourceLoaded(true);
  }, []);

  const onPlaybackStart = useCallback((id: string) => {
    if (!id) {
      return;
    }
    const idToTubiIdMap: IdToListingItemMap = new Map(listingData.map(item => [item.id, {
      tubi_id: item.tubi_id,
      parent_id: item.parent_id,
      enable_watch_history: item.enable_watch_history,
    }]));
    const listingItem = idToTubiIdMap.get(id);
    if (!listingItem) {
      return;
    }
    const { tubi_id: newTubiId, parent_id: newParentId, enable_watch_history: newEnableWatchHistory } = listingItem;
    if (newTubiId && newTubiId !== currentTubiId) {
      setCurrentTubiId(newTubiId);
      liveEventListeners.current.onLiveStart(newTubiId);

      if (newEnableWatchHistory) {
        historyListeners.current.onLiveStart(newTubiId, newParentId);
      } else {
        // Stop history tracking when transitioning to untracked content
        historyListeners.current.onLiveStop();
      }
    }

  }, [listingData, currentTubiId, liveEventListeners, historyListeners]);

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
        scriptLoadedRef.current.promise = loadScript(`${liveEventScriptsPrefix}/wpf_player.js`);
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
    loadFNGScript();
  }, [addLog]);

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
        controls: {
          disableKeyboardActions: true,
          disableStopBehavior: true,
        },
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
          MediaPlaying: /* istanbul ignore next */ (e: any) => {
            addLog('MediaPlaying');
            setFatalError(false);
            liveEventListeners.current.onLiveProgress(e);
            historyListeners.current.onLiveProgress(e);
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
          // Ad
          PlaybackStart: /* istanbul ignore next */ (e: any) => {
            addLog('PlaybackStart');
            // For 3.2.4 we will receive empty assetInfo, so add a defensive check
            foxPlayerListeners.current.onPlaybackStart(e.assetInfo?.id || '');
          },
          AdStart: /* istanbul ignore next */ (e: any) => {
            playingAdRef.current = {
              id: e.ad.id,
              title: e.ad.adTitle,
              video: listing.currentProgram?.tubi_id || '',
              duration: 0,
              sequence: e.ad.sequence,
            };
            const foxAd = {
              id: e.ad.id,
              creativeId: e.ad.creativeId,
              adTitle: e.ad.adTitle,
              duration: e.ad.duration,
              sequence: e.ad.sequence,
              adSystem: e.ad.adSystem,
              isLinear: e.ad.isLinear,
            };
            liveEventListeners.current.onLiveAdStart(foxAd);
            addLog('AdStart');
          },
          AdComplete: /* istanbul ignore next */ (e: any) => {
            playingAdRef.current = undefined;
            const foxComplete = {
              ad: {
                id: e.ad.id,
                creativeId: e.ad.creativeId,
                adTitle: e.ad.adTitle,
                duration: e.ad.duration,
                sequence: e.ad.sequence,
                adSystem: e.ad.adSystem,
                isLinear: e.ad.isLinear,
                clickThroughUrl: e.ad.clickThroughUrl,
              },
              trackingData: e.trackingData,
            };
            liveEventListeners.current.onLiveAdFinished(foxComplete);
            addLog('AdComplete');
          },
          AdPodStart: /* istanbul ignore next */ () => {
            addLog('AdPodStart');
          },
          AdPodComplete: /* istanbul ignore next */ () => {
            addLog('AdPodComplete');
          },
          RemovePlayer: /* istanbul ignore next */ () => {
            if (playingAdRef.current) {
              const foxComplete = {
                ad: {
                  id: playingAdRef.current.id,
                  creativeId: undefined,
                  adTitle: playingAdRef.current.title,
                  duration: playingAdRef.current.duration,
                  sequence: playingAdRef.current.sequence,
                },
              };
              liveEventListeners.current.onLiveAdFinished(foxComplete as any);
            }
            addLog('RemovePlayer');
          },

        },
      };
      const conf = {
        player: config,
        source,
        ads: {
          publisherId: deviceId,
          // Pass device_id as debug parameter when enabled via Feature Switch
          debugParameter: FeatureSwitchManager.isEnabled(['Ad', 'DebugParameter']) ? String(deviceId).replaceAll('-', '') : undefined,
        },
        api: {
          key: API_KEY === 'tubi_tizen' ? 'tubi_samsung' : API_KEY,
          videoBaseUrl: 'https://prod.api.digitalvideoplatform.com/tubi/v3.0',
        },
        privacy: {
          us: usPrivacyString || US_PRIVACY_STRING_OPT_IN,
          lat: systemApi.getAdvertiserOptOut?.() === 1,
        },
        services: {},
      };

      const player = new Player(playerRef.current, conf);
      debugLog('player is ready');
      addLog('player is ready');
      player.load();
      setPlayer(player);
      foxPlayerRef.current = player;

      exposeToTubiGlobal({ liveEventPlayer: player });
    } catch (error) {
      debugLog('error building player', { error });
      addLog('error building player');
    }
  }, [addLog, deviceId, listing.currentProgram, liveEventListeners, historyListeners, playingAdRef, userId, shouldStartOTTPlayer, usPrivacyString]);

  useEffect(() => {
    buildPlayer();
  }, [
    buildPlayer,
    forceReloadCount,
  ]);

  useEffect(() => {
    // bypass the eslint warning the exhaustive-deps
    const liveEvents = liveEventListeners;
    const historyEvents = historyListeners;
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
      historyEvents.current.onLiveProgressFlush();
    };
  }, [addLog, liveEventListeners, historyListeners]);

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
