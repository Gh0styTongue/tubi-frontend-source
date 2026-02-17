import { PLAYER_EVENTS, ActionTypes, HLS_JS_LEVEL } from '@adrise/player';
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { now } from '@adrise/utils/lib/time';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import HlsAdapter from 'client/features/playback/live/liveAdapters/hls';
import { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getHDMIManagerConfig, HDMIManager } from 'client/features/playback/services/HDMIManager';
import { attachVisibilityManager } from 'client/features/playback/services/VisibilityManager';
import * as LiveVideoSession from 'client/features/playback/session/LiveVideoSession';
import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { liveVideoStack } from 'client/features/playback/session/LiveVideoStack';
import { trackLivePlayerExit } from 'client/features/playback/track/client-log';
import { trackLivePlayerServiceQuality } from 'client/features/playback/track/client-log/trackLivePlayerServiceQuality';
import { exposeToTubiGlobal, type TubiGlobalPlayer } from 'client/global';
import { isCrawler } from 'client/utils/isCrawler';
import { getRainmakerAlias } from 'common/constants/platforms';
import { setLiveLoading, setLivePlayerReadyState } from 'common/features/playback/actions/live';
import { useLivePlaybackContext } from 'common/features/playback/components/LivePlaybackProvider/LivePlaybackProvider';
import { LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import { getCachedVideoResourceManager } from 'common/features/playback/services/VideoResourceManager';
import { addStreamUrl, comparePriority, getPriority } from 'common/features/playback/utils/streamUrlPriority';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { ChannelEPGInfo } from 'common/types/epg';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { getCaptionFromTextTrack } from 'common/utils/captionTools';

import { useTrackLiveEvent } from './useTrackLiveEvent';
import { useTrackLivePlayerExit } from './useTrackLivePlayerExit';

export const isLeftNavExpandedSelector = ({ ottUI }: StoreState) => !!ottUI?.leftNav?.isExpanded;
export const isEPGTopNavActiveSelector = ({ ottUI }: StoreState) => !!ottUI?.epg?.topNav?.isActive;
export const focusedContentIdSelector = ({ ottUI }: StoreState) => ottUI?.epg?.focusedContentId;

export interface UseLiveParams {
  video?: Video | ChannelEPGInfo;
  videoPlayer: PlayerDisplayMode;
  getAdQuery: () => Record<string, any>;
  performanceCollectorEnabled: boolean;
  useHlsNext?: boolean;
  isWebEpgEnabled?: boolean;
  enableCapLevelOnFSPDrop?: boolean;
  retries?: number;
  enableProgressiveFetch?: boolean;
}

const useLiveLoading = ({
  wrapper,
}: {
  wrapper: LivePlayerWrapper | null,
}) => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!wrapper) {
      return;
    }

    // bind event handler when the new video element is created
    const updateLoadingWhenPlaybackStart = () => {
      dispatch(setLiveLoading(false));
      wrapper.removeListener(PLAYER_EVENTS.time, updateLoadingWhenPlaybackStart);
    };

    const updatePlayerReadyState = () => {
      dispatch(setLivePlayerReadyState(true));
      wrapper.removeListener(PLAYER_EVENTS.ready, updatePlayerReadyState);
    };

    const updateCaptions = (textTracks: TextTrack[]) => {
      const captions = textTracks.map(track => getCaptionFromTextTrack(track));
      dispatch({
        type: ActionTypes.UPDATE_PLAYER_CAPTIONS,
        payload: { captionsList: captions },
      });
    };

    wrapper.addListener(PLAYER_EVENTS.time, updateLoadingWhenPlaybackStart);
    wrapper.addListener(PLAYER_EVENTS.ready, updatePlayerReadyState);
    wrapper.addListener(PLAYER_EVENTS.captionsListChange, updateCaptions);

    return () => {
      wrapper.removeListener(PLAYER_EVENTS.time, updateLoadingWhenPlaybackStart);
      wrapper.removeListener(PLAYER_EVENTS.ready, updatePlayerReadyState);
      wrapper.removeListener(PLAYER_EVENTS.captionsListChange, updateCaptions);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper]);
};

const useNextStream = ({ streamUrl, id, lastStream }: {
  streamUrl: string;
  id: string;
  lastStream:
    { url: string; id: string }
    | null
  }
) => {

  if (streamUrl.length && getPriority(streamUrl) === 0) {
    // in case some streamUrls come from SSR, not by reducers
    addStreamUrl(streamUrl);
  }
  // TODO enable this for the Web platform.
  const highPriority = __ISOTT__ ? comparePriority(streamUrl, lastStream?.url || '') : true;
  const streamChanged = lastStream !== null && id !== lastStream.id;
  streamUrl = ((streamChanged || highPriority) ? streamUrl : lastStream?.url) || '';
  const streamChangedRef = useRef({
    streamChanged,
  });
  streamChangedRef.current.streamChanged = streamChanged;

  return {
    streamChangedRef,
    streamUrl,
  };
};

const useLive = ({
  video,
  getAdQuery,
  videoPlayer,
  performanceCollectorEnabled,
  useHlsNext,
  isWebEpgEnabled = false,
  enableCapLevelOnFSPDrop = false,
  retries = 0,
  enableProgressiveFetch = false,
} : UseLiveParams) => {
  const {
    id = '',
    title = '',
    has_subtitle: hasSubtitles,
  } = video || {};

  const dispatch = useDispatch();
  const videoResourceManager = getCachedVideoResourceManager({
    videoResources: video?.video_resources || [],
    isDRMSupported: false,
    rememberFallback: false,
  });
  const videoResource = videoResourceManager.getCurrentResource();
  const enableApolloAdClient = videoResource?.ssai_version === 'apollo';
  const videoRef = useRef<HTMLVideoElement>(null);

  const originalStreamUrl = videoResource?.manifest?.url || '';
  const [wrapper, setWrapper] = useState<LivePlayerWrapper | null>(null);
  const [qualityManager, setQualityManager] = useState<LivePlaybackQualityManager | undefined>();
  const [lastStream, setLastStream] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const videoResourceRef = useRef(videoResource);
  videoResourceRef.current = videoResource;

  const { streamUrl, streamChangedRef } = useNextStream({ streamUrl: originalStreamUrl, id, lastStream });
  const { update } = useLivePlaybackContext();
  useEffect(() => {
    let newWrapper: LivePlayerWrapper;
    let hdmiManager: HDMIManager;
    let newQualityManager: LivePlaybackQualityManager;
    let detachVisibilityManager: VoidFunction;
    const buildPlayer = async () => {
      if (!videoRef.current || !streamUrl || !id) {
        return;
      }
      // Disable player setup for crawler
      if (__WEBPLATFORM__ === 'WEB' && isCrawler()) {
        dispatch(setLivePlayerReadyState(true));
        return;
      }

      const adQuery = getAdQuery();
      newWrapper = new LivePlayerWrapper({
        videoElement: videoRef.current,
        mediaUrl: addQueryStringToUrl(streamUrl, omitBy({
          ...adQuery,
          platform: getRainmakerAlias(),
          ...(enableApolloAdClient && {
            'ap.pt': 2, // 2 for client pixel tracking
            'ap.furl': __OTTPLATFORM__ === 'TIZEN' ? 1 : 0, // 1 for full url in playlist
          }),
        }, isNil)),
        id,
        title,
        performanceCollectorEnabled,
        shouldReportBufferChange: FeatureSwitchManager.isEnabled(['Player', 'Info']),
        useHlsNext,
        autoplay: true,
        enableCapLevelOnFSPDrop,
        enableApolloAdClient,
        enableProgressiveFetch,
        startLevel: HLS_JS_LEVEL.HIGH,
      });
      hdmiManager = new HDMIManager({
        ...getHDMIManagerConfig(newWrapper, id),
      });

      if (__ISOTT__) {
        detachVisibilityManager = attachVisibilityManager({
          player: newWrapper,
          contentId: id,
          needAnalyticsEvent: false,
        });
      }

      setWrapper(newWrapper);
      setLastStream({
        id,
        url: streamUrl,
      });
      await newWrapper.setup();
      const baseTime = retries ? undefined : getLiveVideoSession().startTimestamp;
      newQualityManager = new LivePlaybackQualityManager({
        player: newWrapper,
        baseTime,
        externalHls: HlsAdapter.getExternalHls(),
        videoResource: videoResourceRef.current,
      });
      setQualityManager(newQualityManager);
      update({
        player: newWrapper,
        qualityManager: newQualityManager,
      });
      exposeToTubiGlobal({ player: newWrapper as unknown as TubiGlobalPlayer, qualityManager: newQualityManager });
    };

    buildPlayer();

    return () => {
      if (id) {
        // Filter the first meaningless playback out
        // eslint-disable-next-line  react-hooks/exhaustive-deps
        if (streamChangedRef.current.streamChanged || !videoRef.current) {
          trackLivePlayerServiceQuality({
            player: newWrapper,
            serviceQualityManager: newQualityManager,
            contentId: id,
          });
        }
        trackLivePlayerExit({ contentId: id });
        const { isDeliberate, startTimestamp, passiveExitCause } = LiveVideoSession.getLiveVideoSession();
        if (isDeliberate && !passiveExitCause) {
          liveVideoStack.push({
            id,
            isDeliberate,
            startTimestamp,
            endTimestamp: now(),
          });
        }
      }
      update({
        player: undefined,
        qualityManager: undefined,
      });
      exposeToTubiGlobal({ player: undefined });
      hdmiManager?.destroy();
      qualityManager?.destroy();
      newWrapper?.destroy();
      detachVisibilityManager?.();
      setWrapper(null);
      setQualityManager(undefined);
      setLastStream(null);
      dispatch(setLivePlayerReadyState(false));
      dispatch(setLiveLoading(true));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, retries, update, videoResourceRef]);

  useTrackLivePlayerExit({
    streamUrl,
    videoPlayer,
    id,
    title,
  });

  useTrackLiveEvent({
    wrapper,
    videoPlayer,
    id,
    streamUrl,
    hasSubtitles,
    isWebEpgEnabled,
  });

  useLiveLoading({ wrapper });

  return { wrapper, videoRef, streamUrl, videoResourceManager, qualityManager };
};

export default useLive;
