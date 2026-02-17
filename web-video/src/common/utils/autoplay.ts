import { SERIES_AUTOPLAY_NUMBER, MOVIE_AUTOPLAY_NUMBER } from 'common/constants/autoplay';
import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getFirstEpisodeIdFromSeries } from 'common/utils/getFirstEpisodeIdFromSeries';
import { getUrlByVideo } from 'common/utils/urlConstruction';

/**
 * compute counter time for episode/movie auto play
 *
 * @param {bool} isEpisode
 * @returns {number}
 */
export const getAutoPlayCounter = (isEpisode: boolean, episodeTime: number = 5): number => {
  if (isEpisode) return episodeTime;
  return 20;
};

export const getAutoPlayContentId = (video: Video): string => {
  const { id, type } = video;
  // The autoplay series should have all episodes and we should play the first episode
  if (type === SERIES_CONTENT_TYPE) {
    return getFirstEpisodeIdFromSeries(video) || convertSeriesIdToContentId(id);
  }
  return id;
};

/**
 * return the playback url to be used in autoplay
 * this must include the ?autoplay=true param
 * @param video
 * @param options
 * @returns {string}
 */
export const getAutoPlayUrl = (video: Video): string => {
  return `${getUrlByVideo({ video })}?autoplay=true`;
};

export const getAutoplayNumber = (video: Video, seriesContentNumber: number = SERIES_AUTOPLAY_NUMBER): number => {
  return video.series_id ? seriesContentNumber : MOVIE_AUTOPLAY_NUMBER;
};
