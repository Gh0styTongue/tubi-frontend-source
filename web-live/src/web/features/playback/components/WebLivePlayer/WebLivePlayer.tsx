import { PLAYER_ERROR_DETAILS, PLAYER_EVENTS, MANIFEST_CDN_EXPIRED_MAX_RETRY, PlayerName } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';
import { isChromeOnAndroidMobile } from '@adrise/utils/lib/ua-sniffing';
import { DialogType } from '@tubitv/analytics/lib/dialog';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import classNames from 'classnames';
import type { FC, Ref, RefObject } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import {
  showErrorModal as showErrorModalOnVideoSession,
  hideErrorModal,
  resetLiveVideoSession,
  toggleFullscreen,
} from 'client/features/playback/session/LiveVideoSession';
import { trackLinearSessionExpired } from 'client/features/playback/track/client-log/trackLinearSessionExpired';
import { trackLinearSessionRecovered } from 'client/features/playback/track/client-log/trackLinearSessionRecovered';
import { loadEPGInfoByContentIds } from 'common/actions/epg';
import { loadVideoById } from 'common/actions/video';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import * as eventTypes from 'common/constants/event-types';
import LinearWebVerticalFitPlayer from 'common/experiments/config/linearWebVerticalFitPlayer';
import WebAndroidDisablePlayback from 'common/experiments/config/webAndroidDisablePlayback';
import WebHlsUpgrade from 'common/experiments/config/webHlsUpgrade';
import { setLiveLoading } from 'common/features/playback/actions/live';
import LiveSubtitleArea from 'common/features/playback/components/LiveSubtitleArea/LiveSubtitleArea';
import { YouboraContentTypes } from 'common/features/playback/constants/youbora';
import { useImagePreview } from 'common/features/playback/hooks/useImagePreview';
import useLive from 'common/features/playback/hooks/useLive';
import { useLivePlayerErrorListener } from 'common/features/playback/hooks/useLiveErrorProcess/useLivePlayerErrorListener';
import { useLivePlayerFrozenDetect } from 'common/features/playback/hooks/useLivePlayerFrozenDetect';
import { useYoubora } from 'common/features/playback/hooks/useYoubora';
import type { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import { getAdOrigin } from 'common/features/playback/utils/adOrigin';
import withYouboraExperimentMapProvider from 'common/HOCs/withYouboraExperimentMapProvider';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isWebEpgEnabledSelector } from 'common/selectors/epg';
import { playerHlsNormalizationUpgradeSelector } from 'common/selectors/experiments/playerHlsNormalizationUpgrade';
import { livePerformanceMetricEnabledSelector } from 'common/selectors/experiments/remoteConfig';
import { userAgentSelector } from 'common/selectors/ui';
import { liveVideoSelector, isWebLinearPlaybackSupportedSelector } from 'common/selectors/webLive';
import type StoreState from 'common/types/storeState';
import { buildDialogEvent } from 'common/utils/analytics';
import { getAppMode } from 'common/utils/appMode';
import { errorContexts, buildErrorCode, errorTypes } from 'common/utils/errorCapture';
import { sendGA4Event } from 'common/utils/ga';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getLinearPageType } from 'common/utils/linearPageType';
import { trackEvent, trackLogging } from 'common/utils/track';
import LiveNewsTile from 'web/components/LiveNewsTile/LiveNewsTile';
import WebErrorModal from 'web/features/playback/components/WebErrorModal/WebErrorModal';
import WebLivePlayerOverlay from 'web/features/playback/components/WebLivePlayerOverlay/WebLivePlayerOverlay';

import styles from './WebLivePlayer.scss';
import { getWebAdQueryObjectForLiveNews } from '../../utils/getWebAdQueryObjectForLiveNews';

// default is the full page view
export type WebPlayerViewMode = 'default' | 'topPage' | 'mini';

interface OwnProps {
  contentId: string;
  playerView?: WebPlayerViewMode;
  isDeeplink?: boolean;
}

export type WebLivePlayerProps = OwnProps & ReturnType<typeof mapStateToProps>;

export const getPlayerViewClassStyle = (playerView: WebPlayerViewMode) => {
  switch (playerView) {
    case 'topPage':
    case 'mini':
      return styles.epgPlayerContainer;
    default:
      return styles.livePlayerContainer;
  }
};

const WebLivePlayer: FC<WebLivePlayerProps> = ({
  channel,
  deviceId,
  contentId,
  userId,
  isKidsModeEnabled,
  isEspanolModeEnabled,
  isMobile,
  videoPlayer,
  performanceCollectorEnabled,
  playerView = 'default',
  isWebEpgEnabled,
  shouldUseHlsNext,
  isLinearPlaybackSupported,
  isDeeplink,
  captionSettings,
}) => {
  const dispatch = useAppDispatch();
  const { publisher_id: publisherId, title, description, has_subtitle: hasSubtitle, lang, id } = channel || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const manifestExpiredRetryMapRef: Ref<Map<string, number>> = useRef(new Map());

  const webHlsUpgrade = useExperiment(WebHlsUpgrade);
  const webAndroidDisablePlayback = useExperiment(WebAndroidDisablePlayback);
  const userAgent = useAppSelector(userAgentSelector);

  const { origin, containerId } = getAdOrigin({
    isDeeplink,
    isFromAutoplay: false,
    isAutomaticAutoplay: false,
  });

  const adOptions = {
    contentId,
    deviceId,
    publisherId,
    userId,
    appMode: getAppMode({ isKidsModeEnabled, isEspanolModeEnabled }),
    origin,
    containerId,
  };

  const getAdQuery = () => getWebAdQueryObjectForLiveNews(adOptions);

  const { wrapper, videoRef, streamUrl, qualityManager } = useLive({
    video: channel,
    getAdQuery,
    videoPlayer,
    performanceCollectorEnabled,
    isWebEpgEnabled,
    useHlsNext: shouldUseHlsNext,
  });

  useEffect(() => {
    if (id) resetLiveVideoSession();
    const manifestExpiredRetryMap = manifestExpiredRetryMapRef.current;
    return () => {
      /* istanbul ignore next */
      manifestExpiredRetryMap?.delete(id);
    };
  }, [id]);

  useEffect(() => {
    toggleFullscreen(videoPlayer);
  }, [id, videoPlayer]);

  useEffect(() => {
    webHlsUpgrade.logExposure();
  }, [webHlsUpgrade]);

  useEffect(() => {
    if (userAgent && isChromeOnAndroidMobile(userAgent)) {
      webAndroidDisablePlayback.logExposure();
    }
  }, [userAgent, webAndroidDisablePlayback]);

  useYoubora(wrapper, {
    contentId,
    contentType: YouboraContentTypes.LINEAR,
    title,
    userId,
    deviceId: deviceId!,
    lang,
    playerName: PlayerName.Linear,
    duration: Infinity,
    dimensions: {
      displayType: getLinearPageType(),
    },
  });

  useEffect(() => {
    if (isMobile && !isLinearPlaybackSupported) {
      dispatch(setLiveLoading(false));
    }
  }, [isMobile, contentId, dispatch, isLinearPlaybackSupported]);

  useEffect(() => {
    const sendGA4VideoStartEvent = () => {
      sendGA4Event('video_start', {
        video_url: getCurrentPathname(),
      });
    };
    /* istanbul ignore next */
    wrapper?.once(PLAYER_EVENTS.play, sendGA4VideoStartEvent);
    return () => {
      /* istanbul ignore next */
      wrapper?.removeListener(PLAYER_EVENTS.play, sendGA4VideoStartEvent);
    };
  }, [wrapper]);

  const [isFatalModalOpen, setFatalModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const playerErrorRef = useRef<ErrorEventData | null>(null);

  function useErrorModal({
    isPlayerStalled,
    videoPlayer,
    wrapper,
  }: {
    isPlayerStalled: boolean;
    videoPlayer: PlayerDisplayMode;
    wrapper: LivePlayerWrapper | null;
  }) {
    function showErrorModal() {
      const errorCodeType = errorTypes.PLAYER.FATAL_ERROR;
      const errorCode = buildErrorCode(errorContexts.PLAYER, errorCodeType);
      trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.PLAYER_ERROR, errorCode));
      setFatalModalOpen(true);
      showErrorModalOnVideoSession();
    }

    function clearErrorModal() {
      setFatalModalOpen(false);
      hideErrorModal();
    }

    useEffect(() => {
      if (!isPlayerStalled || videoPlayer !== PlayerDisplayMode.DEFAULT) return;
      showErrorModal();
      return () => {
        clearErrorModal();
      };
    }, [isPlayerStalled, wrapper, videoPlayer]);
  }

  function useErrorProcessor({
    wrapper,
    stream_url,
    id,
    manifestExpiredRetryMapRef,
    qualityManager,
  }: {
    wrapper: LivePlayerWrapper | null;
    stream_url: string;
    id: string;
    manifestExpiredRetryMapRef: RefObject<Map<string, number>>;
    qualityManager: LivePlaybackQualityManager | undefined;
  }) {
    const playerError = useLivePlayerErrorListener({ wrapper, stream_url, id, qualityManager });
    const sessionExpireRetryingRef = useRef(false);
    useEffect(() => {
      /* istanbul ignore next */
      const retryTimes = manifestExpiredRetryMapRef.current?.get(id) ?? 0;

      // Manifest CDN Expired Error indicates the token of the manifest URL is expired. We should get a newer one from the content side.
      if (playerError?.message === PLAYER_ERROR_DETAILS.MANIFEST_CDN_EXPIRED
        || playerError?.message === PLAYER_ERROR_DETAILS.LINEAR_SESSION_EXPIRED
      ) {

        if (sessionExpireRetryingRef.current) {
          return;
        }

        if (playerError?.message === PLAYER_ERROR_DETAILS.LINEAR_SESSION_EXPIRED) {
          trackLinearSessionExpired({ id, error: playerError, source: 'useErrorProcessor', retryTimes, wrapper });
        }

        if (retryTimes < MANIFEST_CDN_EXPIRED_MAX_RETRY) {
          /* istanbul ignore next */
          manifestExpiredRetryMapRef.current?.set(id, retryTimes + 1);
          sessionExpireRetryingRef.current = true;
          let action = loadEPGInfoByContentIds([id], { force: true });
          if (!isWebEpgEnabled) {
            action = loadVideoById(id, { force: true });
          }
          dispatch(action);
        }
      } else if (!playerError) {
        if (sessionExpireRetryingRef.current) {
          trackLinearSessionRecovered({ id, source: 'useErrorProcessor', wrapper, retryTimes });
        }
        sessionExpireRetryingRef.current = false;
        // clear retry count if there is no error
        manifestExpiredRetryMapRef.current?.set(id, 0);
      }
    }, [playerError, id, manifestExpiredRetryMapRef, wrapper, sessionExpireRetryingRef]);
    const isPlayerStalled = useLivePlayerFrozenDetect({ wrapper, playerError });

    useEffect(() => {
      playerErrorRef.current = playerError;
    }, [playerError]);

    useErrorModal({
      isPlayerStalled,
      videoPlayer,
      wrapper,
    });

    useImagePreview({
      isPlayerStalled,
      dispatch,
      videoPlayer,
    });
  }

  useErrorProcessor({
    wrapper,
    stream_url: streamUrl,
    id: contentId,
    manifestExpiredRetryMapRef,
    qualityManager,
  });

  const verticalFit = useExperiment(LinearWebVerticalFitPlayer);

  const shouldNotRender = !channel || !streamUrl;
  useEffect(() => {
    // FIXME duplicated condition.
    if (shouldNotRender) {
      return;
    }
    verticalFit.logExposure();
  }, [shouldNotRender, verticalFit]);

  if (shouldNotRender) {
    return null;
  }

  const playerErrorDetails = PLAYER_ERROR_DETAILS.LIVE_PLAYBACK_ERROR;
  const handleFatalErrorModalClose = (isRetry: boolean) => {
    if (isRetry) {
      /**
       * if user clicks "retry" button, increase retry count and reuse current video resource,
       * otherwise set retry count to 0.
       */
      const nextRetryCount = retryCount + 1;
      trackLogging({
        type: TRACK_LOGGING.videoInfo,
        subtype: LOG_SUB_TYPE.PLAYBACK.VIDEO_RETRY,
        message: { content_id: contentId, reason: playerErrorDetails, retry: nextRetryCount },
      });
      setRetryCount(nextRetryCount);
      if (playerErrorRef.current && wrapper) {
        wrapper.reload(playerErrorRef.current, { manuallyReload: true });
      }
    }
    setFatalModalOpen(false);
  };

  const playerViewClasses = getPlayerViewClassStyle(playerView);

  return (
    <div className={`${playerViewClasses} ${verticalFit.getValue() ? styles.verticalFit : ''}`} ref={containerRef}>
      {!isFatalModalOpen
        ? <WebLivePlayerOverlay
          wrapper={wrapper}
          lang={channel.lang}
          contentId={contentId}
          title={title}
          description={description}
          hasSubtitle={!!hasSubtitle}
          isMobile={isMobile}
          containerRef={containerRef}
          playerView={playerView}
        >
          {isMobile && !isLinearPlaybackSupported
            ? <LiveNewsTile
              id={contentId}
              trackCb={() => {}}
              className=""
              hideTitle
              showPlayButton={!isLinearPlaybackSupported}
            />
            : <React.Fragment>
              <video ref={videoRef} className={styles.livePlayer} />
              {hasSubtitle ? (
                <LiveSubtitleArea
                  wrapper={wrapper}
                  isMiniPlayer={playerView !== 'default'}
                  captionConfig={captionSettings}
                  classname={classNames(
                    styles.subtitleArea,
                    {
                      [styles.topPlayerSubtitleArea]: playerView === 'topPage',
                      [styles.miniPlayerSubtitleArea]: playerView === 'mini',
                    }
                  )}
                />
              ) : null}
            </React.Fragment>
          }
        </WebLivePlayerOverlay> : null}
      <WebErrorModal
        isOpen={isFatalModalOpen}
        onClose={handleFatalErrorModalClose}
        playerErrorDetails={playerErrorDetails}
      />
    </div>
  );
};

const mapStateToProps = (state: StoreState, { contentId }: OwnProps) => {
  const { auth, ui, live, captionSettings } = state;
  return {
    channel: liveVideoSelector(state, contentId),
    deviceId: auth.deviceId,
    userId: auth.user?.userId,
    isKidsModeEnabled: ui.isKidsModeEnabled,
    isEspanolModeEnabled: ui.isEspanolModeEnabled,
    isMobile: ui.isMobile,
    videoPlayer: live.videoPlayer,
    performanceCollectorEnabled: livePerformanceMetricEnabledSelector(state),
    isWebEpgEnabled: isWebEpgEnabledSelector(state),
    shouldUseHlsNext: playerHlsNormalizationUpgradeSelector(state),
    isLinearPlaybackSupported: isWebLinearPlaybackSupportedSelector(state),
    captionSettings,
  };
};

export default withYouboraExperimentMapProvider(connect(mapStateToProps)(WebLivePlayer));
