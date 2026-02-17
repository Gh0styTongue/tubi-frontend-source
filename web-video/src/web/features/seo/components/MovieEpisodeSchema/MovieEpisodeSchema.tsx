import React, { useMemo } from 'react';

import type { Video } from 'common/types/video';
import MovieEpisodeJsonLd from 'web/features/seo/utils/MovieEpisodeJsonLd';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

interface Props {
  video: Video;
}

const MovieEpisodeSchema = ({ video }: Props) => {
  const jsonLd = useMemo(() => new MovieEpisodeJsonLd(video).getJsonLd(), [video]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default MovieEpisodeSchema;
