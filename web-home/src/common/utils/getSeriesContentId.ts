import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { Video } from 'common/types/video';

export const getSeriesContentId = (video: Video) => {
  return video.type === SERIES_CONTENT_TYPE ? `0${video.id}` : video.id;
};
