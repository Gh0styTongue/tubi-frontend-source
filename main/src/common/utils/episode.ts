import type { MaybeUndefined } from '@tubitv/ott-ui';
import padStart from 'lodash/padStart';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import type { Series } from 'common/types/series';
import { findIndex } from 'common/utils/collection';

const messages = defineMessages({
  seasonAndEpisodeNum: {
    description: 'Short text in the form of "S__:E__" (e.g. "S01:E01") that is used to display the Season and Episode number of an episode of a series succinctly',
    defaultMessage: 'S{seasonNumber}:E{episodeNumber}',
  },
});
interface SeasonAndEpisodeNumberTextParams {
  formatMessage: IntlShape['formatMessage'];
  season: number | string;
  episode: number | string;
}

export const parseEpisodeInfo = (title = '') => {
  const regex = /S(\d+):E(\d+)(\s+-\s+|\s+){1}(.+)/;
  const match = title.match(regex);

  return match
    ? { season: parseInt(match[1], 10), episode: parseInt(match[2], 10), title: match[4] }
    : {
      title,
    };
};

const withLeadingZero = (n: number|string) => padStart(`${n}`, 2, '0');

export function getSeasonAndEpisodeNumberText({ formatMessage, season, episode }: SeasonAndEpisodeNumberTextParams): string {
  return formatMessage(messages.seasonAndEpisodeNum, {
    seasonNumber: withLeadingZero(season),
    episodeNumber: withLeadingZero(episode),
  });
}

/**
 * retrieve next episode id
 *
 * @param {array} seasons season list, each season is a list of episode id
 * @param {string} episodeId referring episode id
 * @returns {string}
 */
export const getNextEpisodeId = (seasons: Series['seasons'] = [], episodeId: string): string | undefined => {
  let nextEpisodeId: string | undefined;
  seasons.some(({ episodes }, seasonIndex) => {
    const index = episodes.findIndex(({ id }) => id === episodeId);
    if (index === -1) return false;
    if (index + 1 < episodes.length) {
      nextEpisodeId = episodes[index + 1].id;
      return true;
    }
    // last episode of current season
    if (seasons && seasonIndex + 1 < seasons.length) {
      nextEpisodeId = seasons[seasonIndex + 1].episodes[0].id;
      return true;
    }
    return false;
  });

  return nextEpisodeId;
};

/**
 * retrieve previous episode id
 *
 * @param {array} seasons as it is on the series object in video.byId
 * @param {string} episodeId
 * @returns {string}
 */
export const getPreviousEpisodeId = (seasons: Series['seasons'] = [], episodeId: string): MaybeUndefined<string> => {
  let prevEpisodeId: MaybeUndefined<string>;
  (seasons || []).some(({ episodes }, seasonIndex) => {
    const index = episodes.findIndex(({ id }) => id === episodeId);
    if (index === -1) return false; // episode is not in this season
    if (index === 0) {
      // first episode of the season
      if (seasonIndex === 0) return true; // first episode of first season
      // there are previous seasons we can go back to
      // so we grab the last episode of last season
      const lastSeason = seasons[seasonIndex - 1];
      const lastSeasonEpisodes = lastSeason.episodes;
      prevEpisodeId = lastSeasonEpisodes[lastSeasonEpisodes.length - 1].id;
      return true;
    }
    // episode is not the first of the seasons therefore we can grab a prev one from current season
    prevEpisodeId = episodes[index - 1].id;
    return true;
  });

  return prevEpisodeId;
};

/**
 * finding the index of a given episode in the series' season and episodes. useful for knowing the position of
 * VideoDetailSeriesSelect
 * @param {string} episodeId
 * @param {Array} seasons [{episodes: [{ id: '312321', num: 1 }, { id: '312322', num: 2}]}] as we have them in the video store
 * @returns {Object} e.g. {season: 0, episode: 2} the episode is in the index 0 of seasons at index 2 of episodes
 */
export const findEpisodeIdx = (
  episodeId?: string,
  seasons: Series['seasons'] = []
): MaybeUndefined<Readonly<{ episode: number; season: number }>> => {
  if (!seasons.length) return;
  let episodePosition;
  seasons.some((s, idx) => {
    const index = findIndex(s.episodes, ({ id }) => id === episodeId);
    if (index < 0) return false;
    episodePosition = {
      season: idx,
      episode: index,
    };
    return true;
  });
  return episodePosition;
};
