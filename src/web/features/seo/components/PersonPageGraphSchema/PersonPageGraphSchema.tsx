import omit from 'lodash/omit';
import React, { useMemo } from 'react';
import type { Graph } from 'schema-dts';

import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { makeFullUrl } from 'common/utils/urlManipulation';
import type { PersonData } from 'web/features/person/types/person';
import { getPersonUrl } from 'web/features/person/utils/person';
import { formatYear } from 'web/features/seo/utils/seo';

import JsonLdScript from '../JsonLdScript/JsonLdScript';
import { genJsonLd as genPersonJsonLd } from '../PersonSchema/PersonSchema';

export const genJsonLd = ({ name, videos }: PersonData): Graph => {
  const personPageUrl = getPersonUrl(name);
  const genId = (id: string) => `${personPageUrl}#${id}`;
  const personJsonLd = genPersonJsonLd({ name, videos });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': genId('person'),
        '@type': 'Person',
        ...omit(personJsonLd, '@context'),
      },
      {
        '@id': genId('videoItemList'),
        '@type': 'ItemList',
        'numberOfItems': videos.length,
        'itemListElement': videos.map((video, idx) => {
          const { actors = [], directors = [], posterarts, thumbnails, title, type, year } = video;
          const genPersonId = (name: string) => `${getPersonUrl(name)}#person`;
          const genPersonList = (name: string) => ({ '@type': 'Person', '@id': genPersonId(name), 'name': name });
          const url = getUrlByVideo({ video, absolute: true });
          const image = makeFullUrl(posterarts[0] || thumbnails[0]);
          const isTvSeries = type === SERIES_CONTENT_TYPE;
          const formattedYear = formatYear(year);

          return {
            '@type': 'ListItem',
            'position': idx + 1,
            'item': {
              '@id': `${url}#video`,
              '@type': isTvSeries ? 'TVSeries' : 'Movie',
              'url': url,
              'name': title,
              'image': image,
              ...(formattedYear && { dateCreated: formattedYear }),
              ...(formattedYear && isTvSeries && { startDate: formattedYear }),
              ...(actors.length && {
                actor: actors.map(genPersonList),
              }),
              ...(directors.length && {
                director: directors.map(genPersonList),
              }),
            },
          };
        }),
      },
    ],
  };
};

const PersonPageGraphSchema = (props: PersonData) => {
  const jsonLd = useMemo(() => genJsonLd(props), [props]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default PersonPageGraphSchema;
