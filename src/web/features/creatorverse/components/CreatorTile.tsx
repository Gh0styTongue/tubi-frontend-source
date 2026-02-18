import { durationToHourAndMinute } from '@adrise/utils/lib/time';
import { ContentTile } from '@tubitv/web-ui';
import type { SubTitlePosition, TileOrientation } from '@tubitv/web-ui';
import React, { memo, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import TileBadge from 'common/components/TileBadge/TileBadge';
import { TUPIAN_SRCSET_MEDIA_QUERY, TUPIAN_POSTERART_PREFIX } from 'common/constants/style-constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { useContent } from 'common/hooks/useContent/useContent';
import { isNewEpisodeSelector } from 'common/selectors/ui';
import type { Video } from 'common/types/video';
import { parseContentImages, formatSrcSet } from 'common/utils/imageResolution';
import { secondsToHoursAndMinutes } from 'common/utils/timeFormatting';
import ComingSoonLabel from 'web/components/ContentDetail/ComingSoonLabel';
import ContentUnavailable from 'web/components/ContentDetail/ContentUnavailable';
import LazyItem from 'web/components/LazyItem/LazyItem';
import { checkIfContentIsComingSoon } from 'web/features/playback/containers/Video/videoUtils';
import { makeHistorySelector } from 'web/rd/containers/MovieOrSeriesTile/MovieOrSeriesTile';

import { getDetailsUrlFromCreator } from '../helper';

interface CreatorTileProps {
  video: Video;
  disableLazyRender?: boolean;
  showProgress?: boolean;
  shouldShowContentUnavailable?: boolean;
  showSubTitleInTitleArea?: boolean;
  onTileClick?: (contentId: string) => void;
}

const TILE_ORIENTATION: TileOrientation = 'landscape';

function CreatorTile({
  video,
  disableLazyRender = false,
  showProgress = false,
  shouldShowContentUnavailable = false,
  showSubTitleInTitleArea = false,
  onTileClick,
}: CreatorTileProps) {
  const intl = useIntl();

  // Get history data from Redux store
  const historySelector = useMemo(() => makeHistorySelector(), []);
  const history = useAppSelector((state) => historySelector(state, video.series_id || video.id));

  // For episodes, find the specific episode's history from the series history
  // For movies/series, use the content's own history
  const resumeEpisodeHistory = useMemo(() => {
    if (!history) return undefined;

    if (history.contentType === 'series' && video.series_id) {
      // This is an episode tile - find this specific episode's history
      return history.episodes?.find(ep => ep.contentId.toString() === video.id);
    }

    // This is a movie or series tile - no need for episode history
    return undefined;
  }, [history, video.id, video.series_id]);

  const resumeEpisodeId = resumeEpisodeHistory ? resumeEpisodeHistory.contentId.toString() : '';
  // Prefetch resume episode data if needed
  const shouldPrepEpisodeCache = !!resumeEpisodeId && showProgress;
  useContent(resumeEpisodeId, { queryOptions: { enabled: shouldPrepEpisodeCache } });

  const handleTileClick = useCallback(() => {
    // Call tracking callback with contentId if provided
    onTileClick?.(video.id);

    const url = getDetailsUrlFromCreator({
      detailed_type: video.detailed_type,
      id: video.id,
      title: video.title,
    });

    if (url) {
      tubiHistory.push(url);
    }
  }, [onTileClick, video.id, video.detailed_type, video.title]);

  // Check if this is a new episode
  const isNewEpisode = useAppSelector(state => isNewEpisodeSelector(state, video.id));
  const location = useLocation();
  // Check if content is coming soon (SSR-safe)
  const shouldShowComingSoon = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return checkIfContentIsComingSoon({
      content: video,
      location,
    });
  }, [video, location]);

  // Calculate progress and time left from history
  const { progress, timeLeft } = useMemo(() => {
    let calculatedProgress: number | undefined;
    let calculatedTimeLeft: string = '';

    const hasHistory = !!history;
    const shouldShowHistoryForSeries = showProgress && resumeEpisodeHistory;

    if (hasHistory && history.contentType === 'movie' && showProgress) {
      calculatedProgress = history.position / history.contentLength;
      calculatedTimeLeft = secondsToHoursAndMinutes(
        history.contentLength - history.position,
        { formatMessage: intl.formatMessage, remaining: true }
      );
    } else if (shouldShowHistoryForSeries) {
      calculatedProgress = resumeEpisodeHistory.position / resumeEpisodeHistory.contentLength;
      calculatedTimeLeft = secondsToHoursAndMinutes(
        resumeEpisodeHistory.contentLength - resumeEpisodeHistory.position,
        { formatMessage: intl.formatMessage, remaining: true }
      );
    }

    return {
      progress: calculatedProgress,
      timeLeft: calculatedTimeLeft,
    };
  }, [history, showProgress, resumeEpisodeHistory, intl]);

  // Memoize image processing
  const { thumbnailSrc, posterSrc, posterSrcSet } = useMemo(() => {
    const thumbnailUrl = video.landscape_images?.[0] || video.hero_images?.[0] || video.thumbnails?.[0] || '';
    const images = thumbnailUrl ? { landscape: [thumbnailUrl] } : undefined;
    const posters = parseContentImages(images as Record<string, string[]>, TUPIAN_POSTERART_PREFIX);
    const srcSet = formatSrcSet(posters);

    return {
      thumbnailSrc: thumbnailUrl,
      posterSrc: video.posterarts?.[0] || posters[0]?.[1] || thumbnailUrl,
      posterSrcSet: srcSet,
    };
  }, [video.landscape_images, video.hero_images, video.thumbnails, video.posterarts]);

  // Format duration
  const readableDuration = useMemo(
    () => durationToHourAndMinute(video.duration),
    [video.duration]
  );

  // Create badge label using TileBadge component
  const labelElement = useMemo(() => {
    let label = null;
    if (shouldShowContentUnavailable) {
      if (shouldShowComingSoon) {
        label = <ComingSoonLabel date={video.availability_starts} />;
      } else {
        label = <ContentUnavailable />;
      }
    } else if (isNewEpisode) {
      label = <TileBadge type="new-episode" />;
    }
    return label;
  }, [shouldShowContentUnavailable, shouldShowComingSoon, video.availability_starts, isNewEpisode]);

  const rating = video.ratings?.[0]?.value || 'NR';
  const descriptor = video.ratings?.[0]?.descriptors?.join(' ') || undefined;

  const [tileTitle, tileSubTitle] = showSubTitleInTitleArea && video.series_title
    ? [video.series_title, video.title]
    : [video.title, undefined];
  const tileSubTitlePosition: SubTitlePosition | undefined = showSubTitleInTitleArea ? 'title-area' : undefined;

  return (
    <LazyItem lazy={!disableLazyRender}>
      {({ active, ref }) => (
        <ContentTile
          lazyActive={active}
          ref={ref}
          tileOrientation={TILE_ORIENTATION}
          title={tileTitle}
          subTitle={tileSubTitle}
          subTitlePosition={tileSubTitlePosition}
          description={showSubTitleInTitleArea ? undefined : video.description}
          label={labelElement}
          posterSrc={posterSrc}
          posterSrcSet={posterSrcSet}
          posterSizes={TUPIAN_SRCSET_MEDIA_QUERY[TUPIAN_POSTERART_PREFIX]}
          thumbnailSrc={thumbnailSrc}
          progress={progress}
          timeLeft={timeLeft}
          onClick={handleTileClick}
          onPlayClick={handleTileClick}
          rating={rating}
          ratingPosition="inline"
          shouldShowDetailsOnMobile
          descriptor={descriptor}
          year={video.year}
          duration={readableDuration}
        />
      )}
    </LazyItem>
  );
}

export default memo(CreatorTile);
