import omit from 'lodash/omit';
import React, { useMemo } from 'react';
import type { IntlShape } from 'react-intl';
import type { Graph } from 'schema-dts';

import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import MovieEpisodeJsonLd from 'web/features/seo/utils/MovieEpisodeJsonLd';

import JsonLdScript from '../JsonLdScript/JsonLdScript';
import { genJsonLd as genVideoObjectJsonLd } from '../VideoObjectSchema/VideoObjectSchema';

interface Props {
  video: Video;
  name?: string;
  isContentUnavailable?: boolean;
}

interface GenJsonLdProps extends Props {
  formatMessage: IntlShape['formatMessage'];
  isContentUnavailable: Required<Props>['isContentUnavailable'];
}

export const genJsonLd = ({ video, formatMessage, name, isContentUnavailable }: GenJsonLdProps): Graph => {
  const videoUrl = getUrlByVideo({ video, absolute: true });
  const genId = (id: string) => `${videoUrl}#${id}`;

  const movieEpisodeJsonLd = new MovieEpisodeJsonLd(video, formatMessage).getJsonLd();
  const graphArray: NonNullable<Graph['@graph']>[number][] = [];

  if (movieEpisodeJsonLd) {
    graphArray.push({
      '@id': genId('video'),
      ...omit(movieEpisodeJsonLd, ['@context', '@id']),
    });
  }

  if (!isContentUnavailable) {
    const videoObjectJsonLd = genVideoObjectJsonLd(video, { name });
    graphArray.push({
      '@id': genId('videoObject'),
      ...omit(videoObjectJsonLd, ['@context', '@id']),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graphArray,
  };
};

const VideoPageGraphSchema = ({ video, name, isContentUnavailable = false }: Props) => {
  const { formatMessage } = useIntl();

  const jsonLd = useMemo(
    () =>
      genJsonLd({
        video,
        formatMessage,
        name,
        isContentUnavailable,
      }),
    [video, formatMessage, name, isContentUnavailable]
  );

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default VideoPageGraphSchema;

