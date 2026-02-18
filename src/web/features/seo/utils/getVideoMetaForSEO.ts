import type { HelmetProps } from 'react-helmet-async';

import { LINEAR_CONTENT_TYPE } from 'common/constants/constants';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Video } from 'common/types/video';
import { parseEpisodeInfo } from 'common/utils/episode';
import { getDeepLinkForVideo, getUrlByVideo } from 'common/utils/urlConstruction';
import { addLocalePrefix, makeFullUrl } from 'common/utils/urlManipulation';
import type { LocaleOptionType } from 'i18n/constants';
import {
  getCanonicalLink,
  getCanonicalMetaByLink,
  getAlternateMeta,
  getSEOPageTitle,
} from 'web/features/seo/utils/seo';

const MAX_META_DESCRIPTION_CHARS = 150;

// exported only for testing
export const truncateDescription = (description: string = '') => {
  if (description.length > MAX_META_DESCRIPTION_CHARS) {
    return `${description.substr(0, MAX_META_DESCRIPTION_CHARS)}...`;
  }
  return description;
};

export const getVideoMetaForSEO = ({
  video,
  series,
  isEpisode,
  deviceId,
  preferredLocale,
}: {
  video: Video | ChannelEPGInfo;
  deviceId: string | undefined;
  series?: Video;
  isEpisode?: boolean;
  preferredLocale?: LocaleOptionType;
}) => {
  const {
    title: contentTitle,
    /* istanbul ignore next: no test for default value */
    posterarts: posters = [],
    /* istanbul ignore next: no test for default value */
    thumbnails = [],
    description: videoDescription,
    id,
    type,
  } = video;
  /* istanbul ignore next */
  const year = 'year' in video ? video.year : undefined;

  const isLiveNews = type === LINEAR_CONTENT_TYPE;

  const basePath = getUrlByVideo({ video, absolute: false });
  const canonical = getCanonicalLink(addLocalePrefix(preferredLocale, basePath));

  // og:image meta should include width and height https://developers.facebook.com/docs/sharing/best-practices/#precaching
  let image = makeFullUrl(posters[0]);
  let width = '226px';
  let height = '325px';
  if (!posters[0]) {
    image = makeFullUrl(thumbnails[0]);
    width = '306px';
    height = '216px';
  }

  let title = contentTitle;
  let limit;
  let SEOCopy = '- Free Movies | Tubi';
  let description = truncateDescription(videoDescription);
  let keywords;

  if (series) {
    if (isEpisode) {
      const episodeTitle = contentTitle;
      const { title: seriesTitle } = series;
      const info = parseEpisodeInfo(episodeTitle);

      title = `${seriesTitle} ${episodeTitle}`;
      description = [
        'Watch',
        seriesTitle,
        info.season && `Season ${info.season} Episode ${info.episode}`,
        info.title,
        'Free Online.',
        videoDescription,
      ]
        .filter(Boolean)
        .join(' ');
    } else {
      title = series.title;
      description = videoDescription;
    }

    limit = Number.POSITIVE_INFINITY;
    SEOCopy = '- Free TV Shows | Tubi';
    keywords = `${title}, Free TV, Full TV shows, TV episodes, Streaming TV, HD TV, Full length TV Episodes`;
  } else if (isLiveNews) {
    SEOCopy = '- Free Live TV | Tubi';
    keywords = `${title}, Free Live TV, Live News, Live Sports, HD Live News`;
  } else {
    if (year) title = `${title} (${year})`;
    keywords = `Watch ${title} Free, Free Movies, Full Streaming Movies, HD Movies, Full Length Movies`;
  }
  const pageTitle = getSEOPageTitle({ title, limit, SEOCopy });
  const deepLink = getDeepLinkForVideo(video);
  const androidAttribution = `utm_campaign=applink&utm_medium=mobile_web&utm_source=fbapplink&utm_content=${id}`;
  const androidDeepLinkParams = `contentType=${series ? 'series' : 'movie'}&contentId=${id}${
    deviceId ? `&deviceId=${deviceId}` : ''
  }`;

  // @link https://ogp.me/#type_video
  let ogType = 'video.movie';
  if (series) {
    ogType = 'video.episode';
  } else if (isLiveNews) {
    ogType = 'video.other';
  }

  let androidUrl = `tubitv://media-details?${androidDeepLinkParams}&${androidAttribution}`;
  if (isLiveNews) {
    androidUrl = `tubitv://live-news/${id}?${androidAttribution}`;
  }

  return {
    title: pageTitle,
    link: [getCanonicalMetaByLink(canonical), ...getAlternateMeta(basePath)],
    meta: [
      { name: 'keywords', content: keywords },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:site_name', content: 'Tubi' },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: width },
      { property: 'og:image:height', content: height },
      { property: 'og:url', content: canonical },
      { property: 'og:type', content: ogType },
      { property: 'og:description', content: videoDescription },
      { property: 'twitter:title', content: title },
      { property: 'twitter:card', content: 'summary' },
      { property: 'twitter:description', content: videoDescription },
      { property: 'twitter:image', content: image },
      { property: 'al:android:url', content: androidUrl },
      { property: 'al:web:url', content: canonical },
      { property: 'al:ios:url', content: deepLink },
    ].filter(Boolean) as NonNullable<HelmetProps['meta']>,
  };
};
