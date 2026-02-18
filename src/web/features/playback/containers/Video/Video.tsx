import { drmActions } from '@adrise/player/lib/action';
import { buildQueryString } from '@adrise/utils/lib/queryString';
import { isExpectedType } from '@adrise/utils/lib/tools';
import classNames from 'classnames';
import type { Location } from 'history';
import memoize from 'memoize-one';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { loadHistory } from 'common/actions/loadHistory';
import { loadSingleTitleReaction } from 'common/actions/userReactions';
import {
  loadEpisodesInSeries,
  loadVideoById,
} from 'common/actions/video';
import {
  SERIES_CONTENT_TYPE,
  EPISODE_PAGINATION_PAGE_SIZE,
} from 'common/constants/constants';
import type {
  AUTO_START_CONTENT } from 'common/constants/constants';
import WebDirectToPlayer from 'common/experiments/config/webDirectToPlayer';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import logger from 'common/helpers/logging';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { useThumbnailSprites } from 'common/hooks/useThumbnailSprites/useThumbnailSprites';
import { deviceIdSelector } from 'common/selectors/deviceId';
import {
  isFullscreenSelector,
  isKidsModeSelector,
  userAgentSelector,
  preferredLocaleSelector,
} from 'common/selectors/ui';
import { isEpisodeSelector, seriesByContentIdSelector, videoByContentIdSelector } from 'common/selectors/video';
import type { FetchDataParams } from 'common/types/container';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getLogLevel } from 'common/utils/log';
import { alwaysResolve } from 'common/utils/promise';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import Footer from 'web/components/Footer/Footer';
import { WebRefreshConsumer } from 'web/context/webRefreshContext';
import DeepLinkActionPrompt from 'web/features/deepLinkActions/components/DeepLinkActionPrompt/DeepLinkActionPrompt';
import { isDeepLinkAction } from 'web/features/deepLinkActions/utils';
import VideoDetail from 'web/features/playback/components/VideoDetail/VideoDetail';
import { useCheckContentAvailability } from 'web/features/playback/containers/Video/hooks/useCheckContentAvailability';
import { useExitPipOnUnmount } from 'web/features/playback/containers/Video/hooks/useExitPipOnUnmount';
import { useInitializePlayerUiPerfMonitor } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useInitializePlayerUiPerfMonitor';
import { useTrackRerenders } from 'web/features/playback/contexts/playerUiPerfMonitorContext/hooks/useMarkRerender';
import MovieEpisodeSchema from 'web/features/seo/components/MovieEpisodeSchema/MovieEpisodeSchema';
import VideoObjectSchema from 'web/features/seo/components/VideoObjectSchema/VideoObjectSchema';
import { getVideoMetaForSEO } from 'web/features/seo/utils/getVideoMetaForSEO';

import styles from './Video.scss';

const getMemoizedMeta = memoize(getVideoMetaForSEO);

export interface VideoRouteProps {
  location: Location<{
    startPos?: string,
    autoplay?: string,
    utm_source?: string,
    action?: string,
    redirectFromSeries?: string;
    [AUTO_START_CONTENT]?: string
  }>;
  params: { id: string };
}

const Video = (props: VideoRouteProps) => {
  useInitializePlayerUiPerfMonitor(props.params.id);
  useTrackRerenders('Video');

  const { params, location } = props;

  // route derivations
  const { query = {} } = location;
  const contentId = params.id;
  const redirectFromSeries = query.redirectFromSeries === 'true';

  // Content selectors
  const video = useAppSelector((state) => videoByContentIdSelector(state, contentId));
  const series = useAppSelector((state) => seriesByContentIdSelector(state, contentId));
  const isEpisode = useAppSelector((state) => isEpisodeSelector(state, contentId));
  const preferredLocale = useAppSelector(preferredLocaleSelector);

  // other selectors
  const deviceId = useAppSelector(deviceIdSelector);
  const userAgent = useAppSelector(userAgentSelector);
  const isFullscreen = useAppSelector(isFullscreenSelector);

  // content avail
  const { isContentReady, isContentUnavailable, setNoVideoResourceFound, showRemindMe } = useCheckContentAvailability({
    contentId,
  });

  // ensure we exit picture-in-picture when user leave player page
  useExitPipOnUnmount({ contentId });

  // prefetch thumbnail sprites
  useThumbnailSprites({ contentId });

  // experiments
  const webDirectToPlayer = useExperiment(WebDirectToPlayer);

  useEffect(() => {
    if (redirectFromSeries) {
      webDirectToPlayer.logExposure();
    }
  }, [userAgent, redirectFromSeries, webDirectToPlayer]);

  const { title, id } = video;

  const videoClassName = classNames(styles.video, {
    [styles.fullscreen]: isFullscreen,
  });

  const meta = getMemoizedMeta({ video, series, isEpisode, deviceId, preferredLocale });

  return (
    <div>
      <Helmet {...meta} />
      <div className={videoClassName} key={video.id}>
        <VideoDetail
          contentId={contentId}
          key={title}
          video={video}
          isContentReady={isContentReady}
          isContentUnavailable={isContentUnavailable}
          setNoVideoResourceFound={setNoVideoResourceFound}
          showRemindMe={showRemindMe}
        />

        <MovieEpisodeSchema video={video} />
        {!isContentUnavailable ? (
          <VideoObjectSchema
            video={video}
            name={meta.meta?.find(/* istanbul ignore next */ ({ property }) => property === 'og:title')?.content}
          />
        ) : null}
      </div>
      {!isEpisode && isDeepLinkAction(location) ? (
        <DeepLinkActionPrompt contentId={id} contentType="movie" location={location} title={title} />
      ) : null}
      {/* For a11y reasons, do not render the footer when in fullscreen mode */}
      {!isFullscreen && (
        <WebRefreshConsumer>{({ enabled }) => <Footer contentId={id} useRefreshStyle={enabled} />}</WebRefreshConsumer>
      )}
    </div>
  );
};

/**
 * if video is episode, load series
 * else load related content
 */
export function fetchDataDeferred({ getState, dispatch, params }: FetchDataParams<{ id: string }>) {
  const { id: targetId } = params;
  dispatch(drmActions.updateDrmKeySystem());
  const promises: Promise<unknown>[] = [
    dispatch(loadVideoById(targetId)),
  ];

  return Promise.all(promises)
    .then(() => {
      const stateAfterLoadVideo = getState();
      const { video: { byId } } = stateAfterLoadVideo;
      const { series_id: seriesId, type } = byId[targetId];
      const isSeries = type === SERIES_CONTENT_TYPE;

      const contentId = isSeries ? `0${targetId}` : targetId;

      const actions: Promise<unknown>[] = [];
      if (seriesId) {
        actions.push(dispatch(loadEpisodesInSeries({ seriesId, season: 1, page: 1, size: EPISODE_PAGINATION_PAGE_SIZE })));
      }

      const isLoggedIn = isLoggedInSelector(stateAfterLoadVideo);
      const isKidsMode = isKidsModeSelector(stateAfterLoadVideo);
      const shouldFetchUserReactions = isLoggedIn && !isKidsMode;
      if (seriesId && shouldFetchUserReactions) {
        actions.push(dispatch(loadSingleTitleReaction(convertSeriesIdToContentId(seriesId)))
          .catch((e: unknown) => {
            logger.error(e, 'Video - error loading user reactions for series');
          })
        );
      } else if (shouldFetchUserReactions) {
        actions.push(dispatch(loadSingleTitleReaction(contentId))
          .catch((e: unknown) => {
            logger.error(e, 'Video - error loading user reactions for content');
          })
        );
      }

      return Promise.all(actions);
    })
    .catch((error) => {
      const loggerType = getLogLevel(error.errType);
      logger[loggerType]({ error, contentId: targetId }, 'error when loading related contents for video container');
      return Promise.reject(error);
    });
}

/**
 * load video
 */
export function fetchData({ getState, dispatch, location, params, res }: FetchDataParams<{ id: string }>) {
  const promises: unknown[] = [];
  const { id: targetId } = params;
  const state = getState();
  const { video: { byId }, ui: { preferredLocale } } = state;

  // we need to get history before render if user goes directly to video page, but protect against rejected promise
  // todo @liam remove __SERVER__ once more graceful handling of 403s is done
  const isLoggedIn = isLoggedInSelector(state);
  if (isLoggedIn && __SERVER__) { // no guest history on web
    promises.push(alwaysResolve(dispatch(loadHistory())));
  }

  /**
   * the content data maybe preloaded in homescreen/category/search,
   * it's enough to render the page even though some fields are missing
   */
  const content = byId[targetId];
  if (!content) {
    promises.push(dispatch(loadVideoById(targetId)));
  }

  if (!__SERVER__) {
    promises.push(dispatch(drmActions.updateDrmKeySystem()));
  }

  return Promise.all(promises)
    .then(/* istanbul ignore next */ () => {
      // execute `getState` again to get latest state
      const { video: { byId: newById } } = getState();
      const video = newById[targetId];
      const { series_id: seriesId } = video;
      const pathname = getUrlByVideo({ video, preferredLocale });
      if (location.pathname !== pathname && isExpectedType<Location>(location, ['state', 'action'])) {
        res?.redirect(301, `${pathname}${buildQueryString(location.query)}`);
        return;
      }

      // only load series data if it's series and rendered on server side,
      // load series data in FDD if it's not server rendering
      if (__SERVER__ && seriesId) {
        return dispatch(loadEpisodesInSeries({ seriesId, season: 1, page: 1, size: EPISODE_PAGINATION_PAGE_SIZE }));
      }
    })
    .catch((error) => {
      const loggerType = getLogLevel(error.errType);
      logger[loggerType]({ error, contentId: targetId }, 'error when loading data for video container');
      return Promise.reject(error);
    });
}

Video.fetchData = fetchData;
Video.fetchDataDeferred = fetchDataDeferred;
Video.reserveContainerContext = true;
Video.hasDynamicMeta = true;
export default Video;
