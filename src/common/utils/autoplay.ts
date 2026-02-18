import { SERIES_AUTOPLAY_NUMBER, MOVIE_AUTOPLAY_NUMBER } from 'common/constants/autoplay';
import { AUTO_PLAY_CONTENT, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { getWebTheaterPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { getFirstEpisodeIdFromSeries } from 'common/utils/getFirstEpisodeIdFromSeries';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import type { LocaleOptionType } from 'i18n/constants';

interface AutoPlayCounterParams {
  isEpisode: boolean;
  episodeSeconds?: number;
  movieSeconds?: number;
}

/**
 * compute counter time for episode/movie auto play
 *
 * @param {bool} isEpisode
 * @returns {number}
 */
export const getAutoPlayCounter = ({ isEpisode, episodeSeconds = 5, movieSeconds = 20 }: AutoPlayCounterParams): number => {
  if (isEpisode) return episodeSeconds;
  return movieSeconds;
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
export const getAutoPlayUrl = (video: Video, preferredLocale?: LocaleOptionType, isTheater?: boolean): string => {
  const pathname = isTheater ? getWebTheaterPlayerUrl(video.id, preferredLocale) : getUrlByVideo({ video });
  return `${pathname}?${AUTO_PLAY_CONTENT}=true`;
};

export const getAutoplayNumber = (video: Video, seriesContentNumber: number = SERIES_AUTOPLAY_NUMBER): number => {
  return video.series_id ? seriesContentNumber : MOVIE_AUTOPLAY_NUMBER;
};
