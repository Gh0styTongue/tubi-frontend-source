import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';

export const getFirstEpisodeIdFromSeries = (video: Series | Video): string | null => {
  const { type, seasons } = video;
  if (type === SERIES_CONTENT_TYPE && seasons && seasons[0]?.episodes) {
    return seasons[0].episodes[0].id;
  }
  return null;
};
