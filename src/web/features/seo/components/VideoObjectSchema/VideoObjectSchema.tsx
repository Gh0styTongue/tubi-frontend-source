import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import type { WithContext, VideoObject } from 'schema-dts';

import { LINEAR_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE, tubiLogoURL } from 'common/constants/constants';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Video, LinearVideo } from 'common/types/video';
import { changeUrlProtocol } from 'common/utils/urlManipulation';

import { toISO6801Duration } from '../../utils/toISO6801Duration';
import JsonLdScript from '../JsonLdScript/JsonLdScript';

export interface Props {
  video: Video | LinearVideo | ChannelEPGInfo;
  name?: string;
}

type Options = Pick<Props, 'name'>;

export const getThumbnailUrl = (video: Partial<Video>) => {
  const { landscape_images: landscapeImages = [], posterarts = [], thumbnails = [] } = video;
  const thumbnailUrl = landscapeImages[0] || thumbnails[0] || posterarts[0];
  return thumbnailUrl ? changeUrlProtocol(thumbnailUrl, 'https') : tubiLogoURL;
};

export const getPosterUrl = (video: Partial<Video>) => {
  const { landscape_images: landscapeImages = [], posterarts = [], thumbnails = [] } = video;
  const posterUrl = posterarts[0] || landscapeImages[0] || thumbnails[0];
  return posterUrl ? changeUrlProtocol(posterUrl, 'https') : undefined;
};

// https://developers.google.com/search/docs/appearance/structured-data/video#video-object
export const genJsonLd = (video: Partial<Video>, options?: Options): WithContext<VideoObject> => {
  const {
    air_datetime: airDatetime,
    availability_ends: availabilityEnds,
    availability_starts: availabilityStarts,
    description = '',
    duration = 0,
    title = '',
    type,
    year,
  } = video;

  const now = dayjs();
  const isLive = type === LINEAR_CONTENT_TYPE;
  const isSportEvent = type === SPORTS_EVENT_CONTENT_TYPE;

  let name = options?.name || (year ? `${title} (${year})` : title);
  let startDate = availabilityStarts || now.toISOString();
  let endDate = availabilityEnds || now.add(1, 'year').toISOString();

  if (isSportEvent) {
    name = title;
    if (airDatetime) {
      startDate = airDatetime;
    }
    endDate = dayjs(startDate).add(duration, 'second').toISOString();
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    'duration': duration ? toISO6801Duration(duration) : undefined,
    'uploadDate': startDate,
    'expires': availabilityEnds || undefined,
    'thumbnailUrl': getThumbnailUrl(video),
    'publication':
      isLive || isSportEvent
        ? [
          {
            '@type': 'BroadcastEvent',
            // For WC matches, we only have replays but not live streams.
            'isLiveBroadcast': !isSportEvent,
            startDate,
            endDate,
          },
        ]
        : undefined,
  };
};

const VideoObjectSchema = ({ video, name }: Props) => {
  const jsonLd = useMemo(() => genJsonLd(video as Video, { name }), [video, name]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default VideoObjectSchema;
