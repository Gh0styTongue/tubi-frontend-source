import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import type { CarouselProps, DropdownProps } from '@tubitv/web-ui';
import { Carousel, Dropdown } from '@tubitv/web-ui';
import classnames from 'classnames';
import findIndex from 'lodash/findIndex';
import pick from 'lodash/pick';
import type { FC } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { AUTO_START_CONTENT } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import seriesMessages from 'common/constants/series-message';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector, uiSelector } from 'common/selectors/ui';
import trackingManager from 'common/services/TrackingManager';
import type { SeriesHistory } from 'common/types/history';
import type { Season } from 'common/types/series';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getSeasonAndEpisodeNumberText } from 'common/utils/episode';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { addLocalePrefix, removeLocalePrefix } from 'common/utils/urlManipulation';
import { matchesRoute } from 'common/utils/urlPredicates';
import { useIntl } from 'i18n/intl';
import { getPath } from 'web/features/seo/utils/seo';
import { getContentIds } from 'web/utils/series';

import ContentTileWithMatureContentGate from './ContentTileWithMatureContentGate';
import { useShouldLoadMoreEpisodes } from './hooks/useShouldLoadMoreEpisodes';
import styles from './VideoDetailSeriesSelect.scss';

export interface VideoDetailSeriesSelectProps extends WithRouterProps {
  seriesId: string;
  seasons?: Season[];
  seasonIndex: number;
  episodeIndex: number;
  onSeasonIndexChange?: (index: number) => void;
  fullWidthLayout?: boolean;
  isNewDesign?: boolean;
}

const EPISODES_CAROUSEL_BREAKPOINTS = {
  xs: '6',
  lg: '4',
} as const;

const EPISODES_CAROUSEL_BREAKPOINTS_WIDE = {
  xs: '6',
  lg: '4',
  xl: '3',
  xxl: '1-5',
} as const;

type IdentityFn = <T>(x: T) => T;
const identity: IdentityFn = (x) => x;

const PLACEHOLDER_CONTENT_IDS = ['placeholder-1', 'placeholder-2', 'placeholder-3'];

const VideoDetailSeriesSelect: FC<VideoDetailSeriesSelectProps> = ({
  seriesId,
  seasons = [],
  seasonIndex,
  episodeIndex,
  onSeasonIndexChange,
  location,
  params,
  fullWidthLayout,
  isNewDesign = false,
}) => {
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(seasonIndex);
  const [carouselIndex, setCarouselIndex] = useState(episodeIndex);
  const [lastVisibleCarouselIndex, setLastVisibleCarouselIndex] = useState(carouselIndex + 1);
  const contentIds = useMemo(() => getContentIds(seasons, selectedSeasonIndex), [seasons, selectedSeasonIndex]);
  const videos = useAppSelector((state) => {
    return pick(state.video.byId, ...contentIds);
  }, shallowEqual);
  const history = useAppSelector((state) => state.history);
  const { preferredLocale } = useAppSelector(uiSelector);
  const intl = useIntl();
  const shouldShowPlaceholder = !seasons.length;

  // Handle loading more episodes when the user scrolls in the carousel
  useShouldLoadMoreEpisodes(seriesId, selectedSeasonIndex, lastVisibleCarouselIndex);

  const options = seasons.map(({ number }) => ({
    value: number,
    label: intl.formatMessage(seriesMessages.seasonDropdownLabel, { seasonNumber: number }),
  }));

  const seasonAndEpisodeNumbersById = useMemo(() => {
    const map: { [contentId: string]: { season: number; episode: number; title: string } } = {};
    seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        map[episode.id] = {
          season: Number(season.number),
          episode: episode.num,
          title: getSeasonAndEpisodeNumberText({
            formatMessage: intl.formatMessage,
            season: season.number,
            episode: episode.num,
          }),
        };
      });
    });
    return map;
  }, [seasons, intl.formatMessage]);

  const renderItem = useCallback<CarouselProps<string>['renderItem']>(
    (contentId, index) => {
      const item = videos[contentId];
      if (!item) {
        return (
          <ContentTileWithMatureContentGate
            tileOrientation="landscape"
            id={contentId}
            className={styles.placeholderContainer}
            title={seasonAndEpisodeNumbersById[contentId]?.title}
            description={intl.formatMessage(seriesMessages.loading)}
          />
        );
      }
      const seriesId = convertSeriesIdToContentId(item.series_id ?? '');

      const seriesHistory = history.contentIdMap[seriesId] as SeriesHistory;
      let progress;
      const itemHistory = seriesHistory?.episodes?.find((item) => String(item.contentId) === String(contentId));
      if (itemHistory) {
        progress = itemHistory.position / itemHistory.contentLength;
      }
      const { title, thumbnails = [], description } = item;

      const url = getUrlByVideo({ video: item });
      const titleUrl = addLocalePrefix(preferredLocale, url);

      const onItemClick = () => {
        trackingManager.createNavigateToPageComponent({
          startX: index,
          startY: 0,
          containerSlug: undefined,
          contentId,
          componentType: ANALYTICS_COMPONENTS.episodeVideoListComponent,
        });
        tubiHistory.push({
          pathname: titleUrl,
          state: {
            [AUTO_START_CONTENT]: true,
          },
        });
      };

      const props = {
        id: contentId,
        title,
        thumbnailSrc: thumbnails[0],
        description,
        progress,
        href: titleUrl,
        renderTitle: (title?: string) => <h2>{title}</h2>,
      };

      return (
        <ContentTileWithMatureContentGate
          tileOrientation="landscape"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={onItemClick}
          // eslint-disable-next-line react/jsx-no-bind
          onPlayClick={onItemClick}
          {...props}
        />
      );
    },
    [videos, history.contentIdMap, preferredLocale, seasonAndEpisodeNumbersById, intl]
  );

  const onIndexChange = useCallback<NonNullable<CarouselProps<string>['onIndexChange']>>(
    ({ itemIndex, colsPerPage }) => {
      setCarouselIndex((prevIndex) => {
        trackingManager.sendNavigateWithinPage({
          startX: prevIndex,
          startY: 0,
          endX: itemIndex,
          endY: 0,
          contentId: contentIds[prevIndex],
          componentType: ANALYTICS_COMPONENTS.episodeVideoListComponent,
        });
        return itemIndex;
      });
      setLastVisibleCarouselIndex(itemIndex + colsPerPage - 1);
    },
    [contentIds]
  );

  // istanbul ignore next
  const onClick = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
  }, []);

  const renderOption = useCallback<NonNullable<DropdownProps['renderOption']>>(
    (option, options) => {
      const { label, value } = option;

      // Generate the season link only when params contains title, which avoids duplicated season pages.
      // So the season link will be generated for https://tubitv.com/series/300004985/midsomer-murders
      // but not for https://tubitv.com/series/300004985
      if (!params.title) {
        return label;
      }

      // Should not generate a season link when on an episode page like
      // https://tubitv.com/tv-shows/330892/s02-e01-the-man-possessed-by-an-evil-spirit
      const basePath = removeLocalePrefix(location.pathname);
      if (!matchesRoute(WEB_ROUTES.seriesDetail, basePath) &&
        !matchesRoute(WEB_ROUTES.seriesSeasonDetail, basePath)) {
        return label;
      }

      const href =
        findIndex(options, option) === 0
          ? getPath(WEB_ROUTES.seriesDetail, params)
          : getPath(WEB_ROUTES.seriesSeasonDetail, { ...params, season: value });

      return (
        <a
          className={styles.seriesSeasonLink}
          href={addLocalePrefix(preferredLocale, href)}
          onClick={onClick}
        >
          {label}
        </a>
      );
    },
    [location, params, preferredLocale, onClick]
  );

  const onSelect = useCallback(({ value }: { value: string }) => {
    const index = options.findIndex((item) => item.value === value);
    setCarouselIndex(0);
    setSelectedSeasonIndex(index);
    onSeasonIndexChange?.(index);
  }, [options, onSeasonIndexChange]);

  useEffect(() => {
    if (isNewDesign) {
      setSelectedSeasonIndex(seasonIndex);
      setCarouselIndex(episodeIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  useEffect(() => {
    setCarouselIndex(0);
    setSelectedSeasonIndex(seasonIndex);
  }, [seasonIndex]);

  const isMobileRedesign = useAppSelector(isMobileDeviceSelector);

  return (
    <div className={classnames(styles.videoDetailSeriesSelect, { [styles.fullWidth]: fullWidthLayout, [styles.newDesign]: isNewDesign, [styles.mobileRedesign]: isMobileRedesign })}>
      <div className={styles.headerContainer}>
        <Dropdown
          key={seriesId}
          options={options}
          defaultOption={options[seasonIndex]}
          onSelect={onSelect}
          renderOption={renderOption}
        />
      </div>
      <Carousel<string>
        key={selectedSeasonIndex}
        index={carouselIndex}
        tileOrientation="landscape"
        data={shouldShowPlaceholder ? PLACEHOLDER_CONTENT_IDS : contentIds}
        onIndexChange={onIndexChange}
        adjustPrevNextForContentTile
        extraKey={identity}
        renderItem={renderItem}
        breakpoints={fullWidthLayout ? EPISODES_CAROUSEL_BREAKPOINTS_WIDE : EPISODES_CAROUSEL_BREAKPOINTS}
        showItemOverflow={isNewDesign}
        containerClassName={styles.carouselContainer}
        prevNextClassName={styles.prevNext}
      />
    </div>
  );
};

export default withRouter(memo(VideoDetailSeriesSelect));
