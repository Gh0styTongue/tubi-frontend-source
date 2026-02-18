import type { QueryClient } from '@tanstack/react-query';
import { CastType } from '@tubitv/analytics/lib/genericEvents';
import type { ThunkAction } from 'redux-thunk';

import { setChromecastAutoplayVisible } from 'common/actions/ui';
import * as actions from 'common/constants/action-types';
import { CC_OFF } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import type { UapiPlatformType } from 'common/constants/platforms';
import type { AuthState, User } from 'common/features/authentication/types/auth';
import { getChromecastParams } from 'common/features/gdpr/onetrust/utils';
import { playerProgress } from 'common/features/playback/hooks/usePlayerProgress';
import { getVideoProps } from 'common/features/playback/utils/getVideoProps';
import type ApiClient from 'common/helpers/ApiClient';
import { prefetchContent } from 'common/hooks/useContent/prefetchUtils';
import { getCachedVideoData, isContentExpired } from 'common/hooks/useContent/queryFunctions';
import { getCaptionIndexSelector } from 'common/selectors/chromecast';
import type StoreState from 'common/types/storeState';
import type { UIAction } from 'common/types/ui';
import type { Video, VideoRating } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { buildCastEventObject } from 'common/utils/analytics';
import { getRFC5646LanguageTag } from 'common/utils/captionTools';
import { sendChromecastCustomMessage } from 'common/utils/chromecast';
import { getResumeInfo } from 'common/utils/getResumeInfo';
import { trackEvent } from 'common/utils/track';
import { ChromecastCustomMessageType } from 'web/features/playback/constants/chromecast';

import type { ChromecastAction } from '../types/chromecast';

export interface ChromecastMediaInfoCustomData {
  autoplay: {
    automatic: boolean;
    deliberate: boolean;
  },
  content: {
    contentId: string;
    contentType: Video['type'],
    parentId: Video['series_id'],
    rating: VideoRating['value'],
    description: Video['description'],
    duration: Video['duration'],
    year: Video['year'],
    pubId: Video['publisher_id'],
    tags: Video['tags'],
  },
  device: {
    userId?: User['userId'],
    deviceId: AuthState['deviceId'],
    platform: UapiPlatformType,
    authToken?: User['token'];
  }
  gdpr?: {
    consents: {
      C0002: boolean,
      C0003: boolean,
      C0004: boolean,
      C0005: boolean
    },
    ads: {
      gdpr: 1 | 0,
      gdpr_analytics: 1 | 0,
      gdpr_personalized_ads: 1 | 0,
      tcf_string: string;
    }
  },
  isLive: boolean,
  isKidsMode: boolean,
}

export const getCustomData = (contentId: string, state: StoreState, options: {
  isFromAutoplayAutomatic?: boolean,
  isFromAutoplayDeliberate?: boolean,
  isLive?: boolean;
} = {}): ChromecastMediaInfoCustomData => {
  const { auth, video: { byId }, ui: { isKidsModeEnabled: isKidsMode } } = state;
  const { deviceId, user } = auth;
  const { userId, token } = (user as User) || {};
  const { ratings = [], description, duration, year, publisher_id: pubId, tags, type, series_id: parentId } = byId[contentId];
  const rating = (ratings[0] || {}).value;
  const contentData = { contentId, contentType: type, parentId, rating, description, duration, year, pubId, tags };
  const deviceData = { deviceId, userId, platform: 'web' as const, authToken: token };
  const gdpr = getChromecastParams();

  return {
    autoplay: {
      automatic: !!options.isFromAutoplayAutomatic,
      deliberate: !!options.isFromAutoplayDeliberate,
    },
    content: contentData,
    device: deviceData,
    isLive: !!options.isLive,
    gdpr,
    isKidsMode,
  };
};
/**
 * this uses the chromecast SDK; cannot happen on the server
 * @param contentId
 * @param options tell sender app to use current position
 * @param queryClient for React Query cache access
 */
export const castVideo = (contentId: string, options: {
  resumeFromCurrentPosition?: boolean;
  isFromAutoplayAutomatic?: boolean;
  isFromAutoplayDeliberate?: boolean;
  isLive?: boolean;
} = {}, queryClient: QueryClient): ThunkAction<
  Promise<void> | undefined,
  StoreState,
  ApiClient,
  ChromecastAction | UIAction
> => {
  return async (dispatch, getState) => {
    const {
      chromecast: {
        castVideoLoading,
        contentId: ongoingContentId,
        captionsIndex: chromecastCaptionsIndex,
      },
      player: {
        captions: {
          captionsList,
          captionsIndex: playerCaptionsIndex,
        },
      },
    } = getState();
    if (castVideoLoading) {
      if (contentId !== ongoingContentId) {
        dispatch(actionWrapper(actions.QUEUE_CAST_VIDEO, { nextCastVideoArgs: [contentId, options, queryClient] as Parameters<typeof castVideo> }));
      }
      return;
    }
    dispatch(actionWrapper(actions.CAST_VIDEO_LOADING, { contentId }));

    const { resumeFromCurrentPosition, isLive } = options;
    const { cast, chrome } = window;
    let state = getState();

    // Check if video data is available in React Query cache or Redux store
    let cachedVideo = getCachedVideoData({ queryClient, contentId, state });
    const hasVideoResources = !!cachedVideo?.video_resources;

    // If video data is missing or expired, fetch it
    if (!hasVideoResources || (cachedVideo && isContentExpired(cachedVideo))) {
      await prefetchContent(queryClient, contentId, {}, dispatch, getState);
      state = getState();
      cachedVideo = getCachedVideoData({ queryClient, contentId, state });
    }
    const castContext = cast.framework.CastContext.getInstance();
    const { video: { byId }, history: { contentIdMap: historyIdMap = {} }, ui: { chromecastAutoplayVisible } } = state;
    const { posterarts = [], has_subtitle: hasSubtitle, video_resources } = cachedVideo || {};
    if (typeof video_resources === 'undefined' || !cachedVideo) {
      const message = 'video resource could not be undefined when you cast the video';
      dispatch(actionWrapper(actions.CAST_VIDEO_LOAD_ERROR, { error: message }));
      throw new Error(message);
    }
    const contentUrl = getVideoProps(video_resources[0]).mediaUrl;
    const parentId = isLive ? '' : cachedVideo.series_id;
    const contentType = 'application/x-mpegurl';
    const mediaInfo = new chrome.cast.media.MediaInfo(contentUrl, contentType);

    mediaInfo.customData = getCustomData(contentId, state, options);
    if (isLive) {
      mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
    }

    // when we start to cast a new content,
    // we need to cancel the autoplay if it existed
    if (chromecastAutoplayVisible) {
      dispatch(setChromecastAutoplayVisible(false));
      sendChromecastCustomMessage({
        type: ChromecastCustomMessageType.AUTOPLAY_CANCEL,
      });
    }

    // attach content or series images
    if (posterarts[0]) {
      mediaInfo.metadata = new chrome.cast.media.MovieMediaMetadata();
      mediaInfo.metadata.images = [new chrome.cast.Image(posterarts[0])];
    } else if (parentId) {
      const cachedSeries = getCachedVideoData({ queryClient, contentId: parentId, state });
      const seriesPosters = (cachedSeries || {}).posterarts;
      if (seriesPosters && seriesPosters.length) {
        mediaInfo.metadata = new chrome.cast.media.MovieMediaMetadata();
        mediaInfo.metadata.images = [new chrome.cast.Image(seriesPosters[0])];
      }
    }

    // attach subtitle track
    if (hasSubtitle && !isLive) {
      mediaInfo.tracks = captionsList.filter(caption => caption.lang && caption.lang.toLowerCase() !== CC_OFF).map((caption, index) => {
        const trackId = index + 1;
        const textTrack = new chrome.cast.media.Track(trackId, window.chrome.cast.media.TrackType.TEXT);
        textTrack.name = caption.label;
        textTrack.language = getRFC5646LanguageTag(caption);
        return textTrack;
      });
    }
    const loadRequest = new chrome.cast.media.LoadRequest(mediaInfo);

    // find the resumePosition
    // optionally get position from player store
    // default is content's position in view history
    const { position: historyPosition } = getResumeInfo({
      byId,
      contentId,
      history: historyIdMap[contentId],
      isSeries: false,
    });
    let resumePosition = 0;
    if (resumeFromCurrentPosition) {
      resumePosition = playerProgress().position;
    } else if (historyPosition > 0) {
      resumePosition = historyPosition;
    }

    loadRequest.currentTime = resumePosition;

    const captionsIndex = getCaptionIndexSelector(getState());
    if (captionsIndex > 0) {
      loadRequest.activeTrackIds = [captionsIndex];
    }

    const castSession = castContext.getCurrentSession();
    if (!castSession) {
      throw new Error('There is no cast session when we cast video');
    }
    return castSession.loadMedia(loadRequest)
      .then(() => {
        dispatch(actionWrapper(actions.CAST_VIDEO_LOAD_SUCCESS));
        if (playerCaptionsIndex > 0 && chromecastCaptionsIndex === 0) {
          dispatch(actionWrapper(actions.SET_CAST_CAPTIONS_INDEX, { captionsIndex: playerCaptionsIndex }));
        }
        const castEventBody = buildCastEventObject(contentId, resumePosition, CastType.CHROMECAST);
        trackEvent(eventTypes.CAST, castEventBody);
        return Promise.resolve();
      })
      .catch((error) => {
        dispatch(actionWrapper(actions.CAST_VIDEO_LOAD_ERROR, { error }));
        return Promise.reject(error);
      })
      .finally(() => {
        const { chromecast: { nextCastVideoArgs } } = getState();
        if (nextCastVideoArgs) {
          dispatch(actionWrapper(actions.QUEUE_CAST_VIDEO, { nextCastVideoArgs: null }));
          dispatch(castVideo(...nextCastVideoArgs));
        }
      });
  };
};
