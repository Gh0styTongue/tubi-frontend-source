import type { Player } from '@adrise/player';
import { PLAYER_CONTENT_TYPE, State as PLAYER_STATES, PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useEffect, useRef } from 'react';

import { add, syncAppHistory } from 'common/actions/history';
import { setResumePosition } from 'common/actions/video';
import { PLAYER_UPDATE_HISTORY_INTERVAL } from 'common/constants/player';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { contentTypeSelector, playerStateSelector } from 'common/selectors/playerStore';
import type { Video } from 'common/types/video';
import { isValidPosition } from 'ott/features/playback/utils/isValidPosition';

interface UseWatchHistoryParams {
  video: Video;
}

interface UpdateHistoryParams {
  syncHistoryWithServer?: boolean;
}

export const useWatchHistory = ({
  video,
}: UseWatchHistoryParams) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const duration = video.duration;
  const belongSeries = video.series_id;
  const contentId = video.id;
  const viewHistoryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const playerContentType = useAppSelector(contentTypeSelector);
  const playerState = useAppSelector(playerStateSelector);
  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;

  const playerRef = useRef<InstanceType<typeof Player>>();

  const durationRef = useRef(duration);
  durationRef.current = duration;

  /**
   * Write history to the store, possibly sending it to the server
   */
  const updateHistory = useCallback(
    (position: number, { syncHistoryWithServer }: UpdateHistoryParams = { syncHistoryWithServer: false }) => {
      const historyPosition = Math.floor(position);
      if (!isLoggedIn) return; // don't store guest history on web
      if (playerContentType === PLAYER_CONTENT_TYPE.ad || historyPosition === 0) return;

      const playbackData = {
        contentId,
        contentType: belongSeries ? 'episode' : 'movie',
        parentId: belongSeries || null,
        position: historyPosition,
        location,
      };
      if (isValidPosition(playbackData.position)) {
        dispatch(add(playbackData)).then(() => {
          dispatch(setResumePosition(playbackData.contentId, playbackData.position));
          if (syncHistoryWithServer) {
            dispatch(syncAppHistory(location));
          }
        });
      }
    },
    [dispatch, belongSeries, playerContentType, isLoggedIn, contentId, location]
  );

  // allow updateHistory to be referenced in timer callbacks
  const updateHistoryRef = useRef(updateHistory);
  updateHistoryRef.current = updateHistory;

  /**
   * Handler for player seeks
   */
  const handleSeek = useCallback(({ offset }: { offset: number }) => {
    updateHistoryRef.current(offset);
  }, []);

  /**
   * Handler for player complete events
   */
  const handleComplete = useCallback(() => {
    updateHistoryRef.current(durationRef.current);
  }, []);

  /**
   * update view history periodically
   */
  const attachHistoryHandler = useCallback((player: InstanceType<typeof Player>) => {
    playerRef.current = player;

    // update view history periodically
    clearInterval(viewHistoryTimerRef.current);
    viewHistoryTimerRef.current = setInterval(() => {
      if (playerStateRef.current !== PLAYER_STATES.playing) return;

      // use real position to update history rather than redux
      const position = player.getPosition();

      // don't update history during preroll
      if (Math.floor(position) === 0) return;

      updateHistoryRef.current(position);
    }, PLAYER_UPDATE_HISTORY_INTERVAL);

    // update history when seeking
    player.on(PLAYER_EVENTS.seek, handleSeek);

    // update history when complete
    player.on(PLAYER_EVENTS.complete, handleComplete);
  }, [handleSeek, handleComplete]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearInterval(viewHistoryTimerRef.current);
      if (playerRef.current) {
        playerRef.current.off(PLAYER_EVENTS.seek, handleSeek);
        playerRef.current.off(PLAYER_EVENTS.complete, handleComplete);
      }
    };
  }, [handleSeek, handleComplete]);

  /**
   * Write history to the store, possibly sending it to the server
   */
  const syncHistoryWithServer = useCallback(
    (player: InstanceType<typeof Player>) => {
      // call player instance `getPosition` rather than retrieving from store to gain better perf
      const position = player.getPosition();
      updateHistory(position, { syncHistoryWithServer: true });
    },
    [updateHistory]
  );

  return {
    attachHistoryHandler,
    syncHistoryWithServer,
  };
};
