import { VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import type { Video } from 'common/types/video';

// is a given piece of content a movie?
export const getIsMovie = (video: Video): boolean => {
  return video.type === VIDEO_CONTENT_TYPE && !video.series_id;
};
