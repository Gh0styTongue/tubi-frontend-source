import type { AdError, AdErrorEventData, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';
import { init } from '@adrise/player/lib/action';
import { useCallback } from 'react';

import { PlayerType } from 'client/features/playback/track/client-log';
import { trackAdError } from 'client/features/playback/track/client-log/trackAdError';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import { getLocalCaptions, loadWebCustomCaptions, toggleWebCaptions } from 'common/actions/webCaptionSettings';
import * as eventTypes from 'common/constants/event-types';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { adBreaksByContentIdSelector } from 'common/selectors/video';
import type { Video, VideoResource } from 'common/types/video';
import { computeWebCaptionStyles } from 'common/utils/captionTools';
import { trackAppboyEvent } from 'common/utils/track';
import { useAds } from 'web/features/playback/components/WebPlayer/hooks/useAds';
import { useAttachAnalyticsEvents } from 'web/features/playback/components/WebPlayer/hooks/useAttachAnalyticsEvents';
import { useAttachGlobals } from 'web/features/playback/components/WebPlayer/hooks/useAttachGlobals';
import { useRemoveStartPositionQueryParam } from 'web/features/playback/components/WebPlayer/hooks/useRemoveStartPositionQueryParam';
import { useTrackVisualQualityChange } from 'web/features/playback/components/WebPlayer/hooks/useTrackVisualQualityChange';
import type { ShowAlertModal } from 'web/features/playback/components/WebPlayer/hooks/useVideoErrorModal';

const NO_PLAYER_INSTANCE = 'No player instance in onPlayerCreate';

export interface UseManagePlayerLifecycle {
  video: Video;
  startPosition: number;
  showAlertModal: ShowAlertModal;
  videoResource: VideoResource | undefined;
  isFromAutoplay: boolean;
  isDeeplink: boolean;
  blockAutoStart: () => void;
  getAutoStart: () => boolean;
  showAutoPlay: boolean;
}

export const useManagePlayerLifecycle = ({
  video,
  startPosition,
  showAlertModal,
  videoResource,
  isFromAutoplay,
  isDeeplink,
  blockAutoStart,
  getAutoStart,
  showAutoPlay,
}: UseManagePlayerLifecycle) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const dispatch = useAppDispatch();
  const adBreaks = useAppSelector((state) => maybeOverrideCuePoints(adBreaksByContentIdSelector(state, video.id)));

  // useLatest invocations to allow for stable callbacks
  const videoRef = useLatest(video);
  const showAlertModalRef = useLatest(showAlertModal);

  // Callback to remove the start position query param from the URL
  useRemoveStartPositionQueryParam();

  const blockAutoStartRef = useLatest(blockAutoStart);

  // Expose playerRef to the window object for debugging purposes
  useAttachGlobals({ video });

  // Callbacks for managing analytics events
  useAttachAnalyticsEvents({
    startPosition,
    video,
    videoResource,
  });

  useTrackVisualQualityChange({
    video,
    videoResource,
  });

  // Set up ads
  const {
    isPrerollEnabled,
    getContentAdUrl,
  } = useAds({
    adBreaks,
    isFromAutoplay,
    video,
    isDeeplink,
    showAutoPlay,
  });

  usePlayerEvent(PLAYER_EVENTS.captionsChange, useCallback(({ captionsIndex }: { captionsIndex: number }) => {
    const player = getPlayerInstance();
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const captionsList = player.getCaptionsList();
    const { lang, label } = captionsList[captionsIndex];
    const language = lang || label;
    dispatch(toggleWebCaptions({
      ...(language.toLowerCase() !== 'off' ? { language } : {}),
      enabled: language.toLowerCase() !== 'off',
    }));
  }, [dispatch, getPlayerInstance]));

  usePlayerEvent(PLAYER_EVENTS.adError, useCallback((error: AdError, { ad, adPosition, adsCount, adSequence, isPreroll, lagTime }: AdErrorEventData) => {
    const player = getPlayerInstance();
    if (!player) throw new Error(NO_PLAYER_INSTANCE);
    const { id } = videoRef.current;
    const adInfo = {
      contentId: id,
      position: player.getPosition(),
      url: ad?.video,
      id: ad?.id,
      duration: ad?.duration,
      index: adSequence,
      count: adsCount,
      adPosition,
      isPreroll,
      player: PlayerType.VOD,
      lagTime,
    };
    trackAdError(error, adInfo);

    logger.error({ err: error, contentId: id }, 'Web player ad error');

    if (error && error.name && (error.name === 'NotAllowedError')) {
      blockAutoStartRef.current();
    }

  }, [blockAutoStartRef, videoRef, getPlayerInstance]));

  usePlayerEvent(PLAYER_EVENTS.play, useCallback(() => {
    trackAppboyEvent(eventTypes.APPBOY_START_VIDEO);
  }, []));

  /**
   * Subscribe to player creation
   */
  const startPositionRef = useLatest(startPosition);

  // We strictly only want to run this when a player is created in order to avoid running it
  // when returning to the same video page when in the player portal
  useOnPlayerCreate(useCallback((player: InstanceType<typeof Player>) => {
    const { duration } = videoRef.current;
    dispatch(init(player, startPositionRef.current, duration));
  }, [dispatch, videoRef, startPositionRef]), { preventRunOnMount: true });

  const onPlayerCreate = useCallback((player: InstanceType<typeof Player>, playerManagers?: PlayerManagers) => {

    const errorManager = playerManagers?.errorManager;
    if (errorManager) {
      errorManager.setShowModal(showAlertModalRef.current);
    }

    const captionSettingsFromStorage = getLocalCaptions();
    if (captionSettingsFromStorage) {
      dispatch(loadWebCustomCaptions(captionSettingsFromStorage));
      player.setCaptionsStyles(computeWebCaptionStyles(JSON.parse(captionSettingsFromStorage)));
    }
  }, [
    dispatch,
    showAlertModalRef,
  ]);
  useOnPlayerCreate(onPlayerCreate);

  return { getAutoStart, isPrerollEnabled, getContentAdUrl };
};
