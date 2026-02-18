import React, { useMemo } from 'react';
import type { WithContext, ItemList } from 'schema-dts';

import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

interface Props {
  videos?: Video[];
}

// Using "summary page + multiple full details pages" schema for saving the page size.
// https://developers.google.com/search/docs/appearance/structured-data/movie#summary
export const genJsonLd = (videos: NonNullable<Props['videos']>): WithContext<ItemList> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': videos.map((video, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'url': getUrlByVideo({ video, absolute: true }),
    })),
  };
};

const MovieItemListSchema = ({ videos = [] }: Props) => {
  const jsonLd = useMemo(() => {
    if (!videos.length) {
      return null;
    }

    return genJsonLd(videos);
  }, [videos]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default MovieItemListSchema;
