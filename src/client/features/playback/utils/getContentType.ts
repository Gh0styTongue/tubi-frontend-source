import { LINEAR_CONTENT_TYPE, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Video } from 'common/types/video';

export enum ContentType {
  SERIES = 'series',
  EPISODE = 'episode',
  MOVIE = 'movie',
  LINEAR = 'linear',
}
export const getContentType = (content: Video | ChannelEPGInfo): ContentType => {
  switch (content.type) {
    case LINEAR_CONTENT_TYPE: {
      return ContentType.LINEAR;
    }
    case SERIES_CONTENT_TYPE: {
      return ContentType.SERIES;
    }
    default: {
      if ('series_id' in content && content.series_id) {
        return ContentType.EPISODE;
      }
      return ContentType.MOVIE;
    }
  }
};
