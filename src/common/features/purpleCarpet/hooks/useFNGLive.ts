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
import { platform } from 'src/config';

import getAppId from './getAppId';
import useFoxLiveLog from './useFoxLiveLog';
import { loadListing } from '../action';
import { isPurpleCarpetDeportesSelector } from '../selector';
import type { WPFPlayer } from '../type';

const API_KEY = `tubi_${platform}`;
interface ListingItem {
  id: string;
  tubi_id: string;
  startDate: string;
  endDate: string;
  network: string;
}
const debugLog = getDebugLog('fox_live');
export const useListingData = (listingData: ListingItem[], contentId: string, isDeportesId: boolean = false) => {
  const listingRef = useRef({
    currentProgram: undefined as ListingItem | undefined,
    refresh: noop,
    listing: [] as ListingItem[],
  });

  const dispatch = useAppDispatch();
  const [_, setCurrentProgram] = useState<ListingItem | undefined>(undefined);

  const currentDate = useAppSelector((state) => state.ui.currentDate);
  const inProgressContents = listingData.filter((item: ListingItem) => isInProgress(item.startDate, item.endDate, currentDate));

  let inProgressContent: ListingItem | undefined;
  if (isDeportesId) {
    inProgressContent = inProgressContents.find((item) => item.tubi_id === contentId && item.network === 'foxdep');
  } else if (inProgressContents.length === 1) {
    inProgressContent = inProgressContents[0];
  } else if (inProgressContents.length > 1) {
    inProgressContent = inProgressContents.find((item) => item.tubi_id === contentId && item.network !== 'foxdep') || inProgressContents.find(item => item.network !== 'foxdep');
  }

  const fetchListing = useCallback(() => {
    return dispatch(loadListing(true));
  }, [dispatch]);

  useEffect(() => {
    listingRef.current = {
      refresh: fetchListing,
      currentProgram: inProgressContent,
      listing: listingData,
    };
    setCurrentProgram(inProgressContent);
  }, [fetchListing, inProgressContent, listingData]);

  useEffect(() => {
    if (!inProgressContent && listingData.length === 0) {
      fetchListing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return listingRef.current;
};
const useLive = ({
  contentId,
}: {
  contentId: string;
}) => {
  const [foxPlayer, setPlayer] = useState<WPFPlayer | null>(null);
  const foxPlayerRef = useRef<WPFPlayer | null>(null);
  const dispatch = useDispatch();
  const firstOnTimeRef = useRef(true);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const isDeportesId = useAppSelector((state) => isPurpleCarpetDeportesSelector(state, contentId));
  const listingData = useAppSelector((state) => state.purpleCarpet.listing);
  const listingRef = useListingData(listingData, contentId, isDeportesId);
  const [fatalError, setFatalError] = useState(false);
  const [mediaStarted, setMediaStarted] = useState(false);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const eventExitRedirectTimer = useRef<ReturnType<typeof setTimeout>>();
  const { addLog } = useFoxLiveLog();
  const retryCountRef = useRef(0);
  const scriptLoadedRef = useRef({
    loaded: false,
    promise: undefined as Promise<void> | undefined,
  });
  const [forceReloadCount, setForceReloadCount] = useState(0);

  const userId = useAppSelector(userIdSelector);
  const deviceId = useAppSelector(deviceIdSelector);

  const foxPlayerListeners = useRef({
    onMediaStart: noop,
    onPlay: noop,
    onMediaPlaying: noop,
    onPlayerError: noop,
    onReady: noop,
    onLiveEnd: noop,
    onSourceLoaded: noop,
  });

  const onPlayerError = useCallback(() => {
    if (!mediaStarted && retryCountRef.current < 1) {
      listingRef.refresh();
      retryCountRef.current += 1;
      return;
    }
    setFatalError(true);
  }, [setFatalError, mediaStarted, listingRef]);

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

  useEffect(() => {
    foxPlayerListeners.current.onPlayerError = onPlayerError;
    foxPlayerListeners.current.onReady = onReady;
    foxPlayerListeners.current.onLiveEnd = onLiveEnd;
    foxPlayerListeners.current.onSourceLoaded = onSourceLoaded;
  }, [onPlayerError, onReady, onLiveEnd, onSourceLoaded]);

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

    loadFNGScript();
  }, [addLog]);

  const liveEventListeners = useTrackFoxLiveEvent({
    videoPlayer: PlayerDisplayMode.DEFAULT,
    id: listingRef.currentProgram?.tubi_id || '',
  });

  useEffect(() => {
    if (listingRef.listing.length && !listingRef.currentProgram) {
      setFatalError(true);
    }
  }, [listingRef.currentProgram, listingRef.listing.length]);

  useEffect(() => {
    const buildPlayer = async () => {
      if (!playerRef.current || !listingRef.currentProgram) {
        debugLog('playerRef.current or listingRef is not ready', { playerRef: playerRef.current, listingRef: listingRef.currentProgram });
        addLog('playerRef.current or listingRef is not ready');
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
        foxPlayerRef.current.removePlayer();
      }

      try {
        const Player = window?.wpf?.player?.WPFPlayer;

        const source = {
          watch: {
            streamId: listingRef.currentProgram?.id,
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
          id: listingRef.currentProgram?.id,
          appId: getAppId(),
          autoplay: true,
          env: 'prod',
          controlsConfig: {
            inactivityDuration: 0, // Autohide controls after N seconds of inactivity. Pass zero to disable controls on startup
          },
          // This is a hack setting to enable volume on the OTT
          mute: !!__WEBPLATFORM__, // Optional: starts playback muted if true. Defaults to false
          mediaInfo: {}, // see below
          watch: {}, // see below
          auth: {}, // see below
          allowPiP: false, // Optional: allow Picture-in-Picture mode. Defaults to false
          width: '100%',
          height: '100%',
          mode: 'live',
          controls: false,
          isLive: true,
          restart: false, // This is used to tell analytics if this content is restarted or not
          // videoID: 'fox-media-FS1-program-25641313', // not needed if mediaInfo is provided
          // releaseURL: 'https://link.theplatform.com/s/BKQ29B/media/k3gVjocHad4a?format=redirect&formats=m3u&sitesection=app.dcg-foxnow%2Fweb%2Ffox', // not needed if mediaInfo is provided
          listeners: {
            Play: () => {
              if (listingRef.currentProgram) {
                liveEventListeners.current.onLiveStart();
              }
            },
            Progress: (e: any) => {
              addLog('MediaPlaying');
              setFatalError(false);
              liveEventListeners.current.onLiveProgress(e);
            },
            PlayerError: () => {
              addLog('PlayerError');
              foxPlayerListeners.current.onPlayerError();
            },
            Ready: () => {
              foxPlayerListeners.current.onReady();
            },
            SourceLoaded: () => {
              foxPlayerListeners.current.onSourceLoaded();
            },
            ExitEventStream: (e: any) => {
              foxPlayerListeners.current.onLiveEnd(e);
              addLog('ExitEventStream');
            },
          },
        };
        const conf = {
          player: config,
          source,
          api: {
            key: API_KEY === 'tubi_tizen' ? 'tubi_samsung' : API_KEY,
            videoBaseUrl: 'https://prod.api.haw.digitalvideoplatform.com/v3.0',
            // videoBaseUrl: 'https://qa.api.venu.digitalvideoplatform.com/v2.0',
          },
          services: {},
        };

        const player = new Player(playerRef.current, conf);
        debugLog('player is ready');
        addLog('player is ready');
        // FIXME we need to invoke load() after player ready event instead of using setTimeout
        player.load();
        setPlayer(player);
        foxPlayerRef.current = player;

        exposeToTubiGlobal({ fngPlayer: player });
      } catch (error) {
        debugLog('error building player', { error });
        addLog('error building player');
      }

    };

    buildPlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, firstOnTimeRef, liveEventListeners, listingRef, listingRef.currentProgram, forceReloadCount]);

  useEffect(() => {
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
    };
  }, [addLog]);

  const reload = useCallback(() => {
    setFatalError(false);
    setForceReloadCount((prev) => prev + 1);
  }, []);

  return { player: foxPlayer, playerRef, fatalError, setFatalError, reload, onReady, onPlayerError, onLiveEnd, sourceLoaded, onSourceLoaded };
};

export default useLive;
