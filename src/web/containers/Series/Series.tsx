import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import type { Location } from 'history';
import React, { Component } from 'react';
import type { HelmetProps } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { loadHistory } from 'common/actions/loadHistory';
import { loadSingleTitleReaction } from 'common/actions/userReactions';
import { loadEpisodesInSeries } from 'common/actions/video';
import { EPISODE_PAGINATION_PAGE_SIZE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import webDirectToPlayer from 'common/experiments/config/webDirectToPlayer';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import withExperiment from 'common/HOCs/withExperiment';
import { webDirectToPlayerSelector } from 'common/selectors/experiments/webDirectToPlayer';
import { firstEpisodeSelector, historyEpisodeSelector, latestEpisodeInfoSelector } from 'common/selectors/history';
import { isKidsModeSelector } from 'common/selectors/ui';
import type { FetchDataParams } from 'common/types/container';
import type { History } from 'common/types/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { UserAgent } from 'common/types/ui';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { findEpisodeIdx } from 'common/utils/episode';
import { getHistoryFromContentIdMap } from 'common/utils/history';
import { getLogLevel } from 'common/utils/log';
import { alwaysResolve } from 'common/utils/promise';
import { encodeTitle } from 'common/utils/seo';
import { getDeepLinkForVideo, getUrlByVideo } from 'common/utils/urlConstruction';
import { addLocalePrefix, makeFullUrl, removeLocalePrefix } from 'common/utils/urlManipulation';
import type { LocaleOptionType } from 'i18n/constants';
import Footer from 'web/components/Footer/Footer';
import SeriesDetail from 'web/components/SeriesDetail/SeriesDetail';
import DeepLinkActionPrompt from 'web/features/deepLinkActions/components/DeepLinkActionPrompt/DeepLinkActionPrompt';
import { isDeepLinkAction } from 'web/features/deepLinkActions/utils';
import {
  checkIfContentIsUnavailable,
  checkIfContentIsComingSoon,
} from 'web/features/playback/containers/Video/videoUtils';
import SeriesSchema from 'web/features/seo/components/SeriesSchema/SeriesSchema';
import {
  getPath,
  getCanonicalLink,
  getCanonicalMetaByLink,
  getAlternateMeta,
  getSEOPageTitle,
} from 'web/features/seo/utils/seo';

interface ExperimentProps {
  webDirectToPlayer: ReturnType<typeof webDirectToPlayer>;
}

type StateProps = {
  contentId: string;
  deviceId?: string;
  series: Video;
  latestEpisodeInfo?: any;
  history?: History;
  isMobile?: boolean;
  isKidsModeEnabled?: boolean;
  isContentReady: boolean;
  isContentUnavailable: boolean;
  isContentComingSoon: boolean;
  isThirdPartySDKTrackingEnabled: boolean;
  seasonIndex?: number;
  onSeasonIndexChange: (index: number) => void;
  userAgent: UserAgent;
  preferredLocale?: LocaleOptionType;
};

interface OwnProps {
  params: { id: string; title?: string; season?: string };
  location: Location;
}

export interface Props extends StateProps, OwnProps, ExperimentProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  location: Location;
}

const messages = defineMessages({
  keywords: {
    description: 'keywords meta for SEO',
    defaultMessage: '{title}, Free, Movies, TV shows, legal, streaming, HD, full length',
  },
  description: {
    description: 'description meta for SEO',
    defaultMessage:
      'Watch {title} Free Online | {seasonsTotal, select, 0 {{description}} 1 {{seasonsTotal} Season. {description}} other {{seasonsTotal} Seasons. {description}}}',
  },
  seoCopy: {
    description: 'SEO copy text for title',
    defaultMessage: 'Streaming Online | Tubi Free TV',
  },
});

class Series extends Component<Props> {
  static fetchData = fetchData;

  static fetchDataDeferred = fetchDataDeferred;

  static reserveContainerContext = true;

  static hasDynamicMeta = true;

  meta: HelmetProps;

  constructor(props: Props) {
    super(props);
    this.getMeta = this.getMeta.bind(this);
    this.meta = this.getMeta();
  }

  componentDidMount(): void {
    this.props.webDirectToPlayer.logExposure();
  }

  getMeta() {
    const { intl, series, params, deviceId, preferredLocale } = this.props;
    const { formatMessage } = intl;
    const { posterarts: posters = [], thumbnails = [], landscape_images: landscapeImages, description, id } = series;
    const { season } = params;

    const pathname = getPath(
      season && season !== '1' ? WEB_ROUTES.seriesSeasonDetail : WEB_ROUTES.seriesDetail,
      {
        ...params,
        title: params.title || encodeTitle(series.title),
      }
    );
    const canonical = getCanonicalLink(addLocalePrefix(preferredLocale, pathname));
    const deepLink = getDeepLinkForVideo(series);
    const imageUrl = makeFullUrl(landscapeImages[0] || posters[0] || thumbnails[0]);
    const title = season ? `${series.title} Season ${season}` : series.title;
    const androidAttribution = `utm_campaign=applink&utm_medium=mobile_web&utm_source=fbapplink&utm_content=${id}`;
    const androidDeepLinkParams = `contentType=series&contentId=${id}${deviceId ? `&deviceId=${deviceId}` : ''}`;

    return {
      title: getSEOPageTitle({ title, limit: Number.POSITIVE_INFINITY, SEOCopy: formatMessage(messages.seoCopy) }),
      link: [
        getCanonicalMetaByLink(canonical),
        ...getAlternateMeta(removeLocalePrefix(pathname)),
      ],
      meta: [
        {
          name: 'keywords',
          content: formatMessage(messages.keywords, {
            title,
          }),
        },
        {
          name: 'description',
          content: formatMessage(messages.description, {
            title,
            description,
            seasonsTotal: (series.seasons || []).length,
          }),
        },
        { property: 'og:title', content: title },
        { property: 'og:image', content: imageUrl },
        { property: 'og:url', content: canonical },
        { property: 'og:type', content: 'tv_show' },
        { property: 'og:description', content: description },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
        { property: 'twitter:image', content: imageUrl },
        {
          property: 'al:android:url',
          content: `tubitv://media-details?${androidDeepLinkParams}&${androidAttribution}`,
        },
        { property: 'al:web:url', content: canonical },
        { property: 'al:ios:url', content: deepLink },
      ],
    };
  }

  render() {
    const {
      contentId,
      location,
      series,
      isMobile,
      isKidsModeEnabled,
      latestEpisodeInfo,
      history,
      dispatch,
      isContentUnavailable,
      isContentComingSoon,
      isThirdPartySDKTrackingEnabled,
      seasonIndex,
      onSeasonIndexChange,
    } = this.props;

    const { id } = series;

    return (
      <div key={id}>
        <Helmet {...this.meta} />
        <SeriesDetail
          series={series}
          dispatch={dispatch}
          latestEpisodeInfo={latestEpisodeInfo}
          history={history}
          isMobile={isMobile}
          isKidsModeEnabled={isKidsModeEnabled}
          isContentUnavailable={isContentUnavailable}
          isContentComingSoon={isContentComingSoon}
          isThirdPartySDKTrackingEnabled={isThirdPartySDKTrackingEnabled}
          seasonIndex={seasonIndex}
          onSeasonIndexChange={onSeasonIndexChange}
        />
        <SeriesSchema series={series} seasonIndex={seasonIndex} />
        {isDeepLinkAction(location) ? (
          <DeepLinkActionPrompt contentId={contentId} contentType="series" location={location} title={series.title} />
        ) : null}
        <Footer contentId={convertSeriesIdToContentId(id)} useRefreshStyle />
      </div>
    );
  }
}

const isSeriesUnavailable = (state: StoreState, id: string) => {
  const {
    video: { fullContentById, byId },
  } = state;
  const content = byId[id];
  const isContentReady = fullContentById[id];
  return checkIfContentIsUnavailable({ isContentReady, content });
};

export async function fetchData({ dispatch, params, res, getState }: FetchDataParams<{ id: string }>) {
  const targetId = params.id;

  const loadSeriesAction = loadEpisodesInSeries({
    seriesId: targetId,
    force: true,
    season: 1,
    page: 1,
    size: EPISODE_PAGINATION_PAGE_SIZE,
  });
  const dataType = 'paginated data';
  try {
    const state = getState();
    const promise: Promise<unknown>[] = [dispatch(loadSeriesAction)];
    const shouldRedirectToPlayer = webDirectToPlayerSelector(state);
    if (isLoggedInSelector(getState()) && shouldRedirectToPlayer) {
      promise.push(alwaysResolve(dispatch(loadHistory())));
    }
    await Promise.all(promise);
    if (shouldRedirectToPlayer) {
      const newState = getState();
      const contentId = `0${targetId}`;
      const firstEpisode = firstEpisodeSelector(newState, contentId);
      const latestEpisodeInfo = latestEpisodeInfoSelector(newState, contentId);
      const episode = latestEpisodeInfo || firstEpisode;
      if (episode) {
        const url = addQueryStringToUrl(getUrlByVideo({ video: episode as Video }), {
          redirectFromSeries: true,
        });
        if (__SERVER__) {
          res?.redirect(302, url);
        } else {
          tubiHistory.push(url);
        }
      }
    }
  } catch (error) {
    const loggerType = getLogLevel(error.errType);
    logger[loggerType]({ error, contentId: targetId }, `error when loading ${dataType} for Series container`);
    return Promise.reject(error);
  }
}

export function fetchDataDeferred({ dispatch, getState, params }: FetchDataParams<{ id: string }>) {
  const { id: targetId } = params;
  const contentId = `0${targetId}`;
  const state = getState();

  const promises: Promise<void>[] = [];
  const seriesUnavailable = isSeriesUnavailable(state, contentId);
  const seriesIsAvailable = !seriesUnavailable;

  const isLoggedIn = isLoggedInSelector(state);
  const isKidsMode = isKidsModeSelector(state);
  if (seriesIsAvailable && isLoggedIn && !isKidsMode) {
    promises.push(
      dispatch(loadSingleTitleReaction(contentId)).catch((e: unknown) => {
        logger.error(e, 'Series - error loading user reactions');
      })
    );
  }

  return Promise.all(promises);
}

const FREEZED_EMPTY_OBJECT = {};

export const mapStateToProps = (state: StoreState, ownProps: OwnProps): StateProps => {
  const {
    video,
    history,
    ui,
    auth: { deviceId },
  } = state;
  const { params, location } = ownProps;
  const { byId, fullContentById } = video;
  const contentId = `0${params.id}`;
  const content = byId[contentId] || FREEZED_EMPTY_OBJECT;
  const { seasons } = content;
  const { isMobile, userAgent, isKidsModeEnabled, preferredLocale } = ui;

  const historyData = getHistoryFromContentIdMap(history.contentIdMap, contentId);

  // get latest episode info of this series
  const latestEpisodeInfo = latestEpisodeInfoSelector(state, contentId);

  const isContentReady = fullContentById[contentId];

  let seasonIndex;

  const { season: seasonParam } = params;
  if (seasonParam) {
    seasonIndex = seasons?.findIndex(({ number }) => number === seasonParam);
    if (seasonIndex === -1) {
      seasonIndex = undefined;
    }
  }

  if (history && seasons) {
    const historyEpisode = historyEpisodeSelector({ history }, contentId);
    if (historyEpisode) {
      const episodeIdx = findEpisodeIdx(historyEpisode.id, seasons);
      if (episodeIdx) {
        seasonIndex = episodeIdx.season;
      }
    }
  }

  const onSeasonIndexChange = (index: number) => {
    // Update browser's address bar for the season URL. To avoid duplicated season content and the params mismatch,
    // the update only takes effect when URL contains a title slug.
    // So https://tubitv.com/series/300004985/midsomer-murders/season-1 is a proper season URL,
    // but https://tubitv.com/series/300004985/season-1 is not.
    if (!params.title) {
      return;
    }

    const season = seasons?.[index].number || `${index + 1}`;
    const path =
      index === 0
        ? getPath(WEB_ROUTES.seriesDetail, params)
        : getPath(WEB_ROUTES.seriesSeasonDetail, { ...params, season });

    // TODO: The current react-router V3 has some issues with scroll restoration
    // when using replace, so I have to alter to use
    // window.history.replaceState. But after migrating to the latest
    // react-router, we should revisit this.
    // Ref: https://github.com/adRise/www/pull/13535#discussion_r1178949617
    window.history.replaceState(null, '', addLocalePrefix(preferredLocale, path));
  };

  return {
    contentId,
    series: content,
    latestEpisodeInfo,
    history: historyData,
    isMobile,
    isKidsModeEnabled,
    isContentReady,
    isContentUnavailable: isSeriesUnavailable(state, contentId),
    isContentComingSoon: checkIfContentIsComingSoon({
      content,
      location,
    }),
    isThirdPartySDKTrackingEnabled: isThirdPartySDKTrackingEnabledSelector(state),
    seasonIndex,
    onSeasonIndexChange,
    userAgent,
    deviceId,
    preferredLocale,
  };
};

export const IntlSeries = injectIntl(Series);

export default withExperiment(connect(mapStateToProps)(IntlSeries), {
  webDirectToPlayer,
});
