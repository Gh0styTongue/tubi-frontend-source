import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import type { WithContext, TVSeries, Person, Episode } from 'schema-dts';

import useAppSelector from 'common/hooks/useAppSelector';
import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { makeFullUrl } from 'common/utils/urlManipulation';
import { getSeasonNumber, getContentIds } from 'web/utils/series';

import JsonLdScript from '../JsonLdScript/JsonLdScript';
import { getBasicPersonObject } from '../PersonSchema/PersonSchema';

const formatDate = (year: number) => {
  if (!year) return;
  return new Date(year.toString()).toISOString().split('T')[0];
};

const getPersonList = (people: string[]): Person[] => people.map(getBasicPersonObject);

const getEpisodeList = (ids: string[], videos: { [i: string]: Video }, seasonNumber: string, seriesTitle: string): Episode[] => {
  return ids.map((id: string) => {
    const video: Video = videos[id] || {};
    const titleUrl = getUrlByVideo({ video });
    return ({
      '@type': 'TVEpisode',
      'name': video.title,
      'episodeNumber': video.episode_number,
      'url': titleUrl,
      'potentialAction': {
        '@type': 'WatchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': titleUrl,
          'inLanguage': video.lang,
          'actionPlatform': [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/IOSPlatform',
            'http://schema.org/AndroidPlatform',
          ],
        },
        'expectsAcceptanceOf': {
          '@type': 'Offer',
          'offeredBy': {
            '@type': 'Organization',
            'name': 'TubiTV',
          },
        },
      },
      'partOfSeason': {
        '@type': 'TVSeason',
        'seasonNumber': seasonNumber,
      },
      'partOfSeries': {
        '@type': 'TVSeries',
        'name': seriesTitle,
      },
    });
  });
};

// https://schema.org/TVSeries
export const genJsonLd = (series: Video, seasonIndex: number, videos: { [videoId: string]: Video }): WithContext<TVSeries> => {
  const {
    actors = [],
    description,
    directors = [],
    posterarts: posters = [],
    ratings,
    seasons = [],
    thumbnails = [],
    tags = [],
    title,
    year,
  } = series;
  const contentIds = getContentIds(seasons, seasonIndex);
  const url = getUrlByVideo({ video: series, absolute: true });
  const imageUrl = makeFullUrl(posters[0] || thumbnails[0]);
  const ratingValue = ratings?.[0]?.value;
  const actorsList = getPersonList(actors);
  const directorsList = getPersonList(directors);
  const formattedYear = formatDate(year);
  const seasonNumber = getSeasonNumber(seasons, seasonIndex);

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    'url': url,
    'name': title,
    'description': description,
    'image': imageUrl,
    ...(ratingValue && { contentRating: ratingValue }),
    ...(formattedYear && { dateCreated: formattedYear, startDate: formattedYear }),
    ...(actorsList.length && { actor: actorsList }),
    ...(directorsList.length && { director: directorsList }),
    ...(seasons.length && { numberOfSeasons: seasons.length }),
    ...(tags.length && { genre: tags }),
    'episode': getEpisodeList(contentIds, videos, `${seasonNumber}`, title),
  };
};

interface Props {
  series: Video;
  seasonIndex?: number;
}

const SeriesSchema = ({
  series,
  seasonIndex = 0,
}: Props) => {
  const videos = useAppSelector((state) => state.video.byId, shallowEqual);

  const jsonLd = useMemo(() => genJsonLd(series, seasonIndex, videos), [series, seasonIndex, videos]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default SeriesSchema;
