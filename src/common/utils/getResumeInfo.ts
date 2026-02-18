import { durationToHourAndMinute } from '@adrise/utils/lib/time';
import type { IntlFormatters } from 'react-intl';
import { defineMessages } from 'react-intl';
import type { ValueOf } from 'ts-essentials';

import { computeCreditTime } from 'common/features/playback/utils/computeCreditTime';
import { getSeasonAndEpisodeNumberForEpisodeId } from 'common/selectors/series';
import type { HistoryEpisode, HistoryState } from 'common/types/history';
import type { Series } from 'common/types/series';
import type { Video } from 'common/types/video';
import { findIndex } from 'common/utils/collection';
import { getResumePositionFromHistory, isHistoryValue } from 'common/utils/history';

export const messages = defineMessages({
  hour: {
    description: 'abbreviation for hour',
    defaultMessage: 'hour',
  },
  min: {
    description: 'abbreviation for minute',
    defaultMessage: 'min',
  },
  left: {
    description: 'left text',
    defaultMessage: 'left',
  },
  season: {
    description: 'season text',
    defaultMessage: 'Season',
  },
  episode: {
    description: 'episode text',
    defaultMessage: 'Episode',
  },
});

interface GetResumeInfoOptions {
  byId: { [key: string]: Video | Series };
  contentId: string;
  history?: ValueOf<HistoryState['contentIdMap']>;
  isSeries?: boolean;
  formatMessage?: IntlFormatters['formatMessage'];
}

export interface ResumeInfo {
  contentId: string | null;
  position: number;
  percentComplete: number | undefined;
  leftTimeText: string;
}

/**
 * get resume contentId and position from the history entry from UAPI
 * @param {Object} options
 * @param {Object} options.history content history, it's the whole series history if the content is a episode/series
 * @param {String} options.contentId content id, it's the episode itself's id if the content is a episode
 * @param {Object} options.byId byId sub store
 * @param {Boolean} options.isSeries whether the content is a series, usually used in series page
 * @returns {Object}
 *  contentId: string, // could be contentId or null
 *  position: number // could be the resume position, or -1 if no resume position
 *  percentComplete: percent // 0 - 1
 *  leftTimeText: string // could be the left the time or the history episode index
 */
export const getResumeInfo = (options: Readonly<GetResumeInfoOptions>): ResumeInfo => {
  const { byId, contentId, history, isSeries, formatMessage = (message) => message.defaultMessage } = options;

  let resumeContentId = null;
  let resumePosition = -1;
  let seasonAndEpisode: ReturnType<typeof getSeasonAndEpisodeNumberForEpisodeId> | undefined;

  const resumeInfo = {
    contentId: null,
    position: -1,
    percentComplete: undefined,
    leftTimeText: '',
  };

  if (!isHistoryValue(history)) return resumeInfo;

  if (history.contentType === 'movie') {
    // for Movie page
    resumeContentId = String(contentId);
    resumePosition = history.position;
  } else if (isSeries) {
    // for Series
    const item = history.episodes[history.position] as HistoryEpisode;
    if (item) {
      resumeContentId = String(item.contentId);
      resumePosition = getResumePositionFromHistory(item);
      const seasons = byId[`0${history.contentId}`]?.seasons;
      seasonAndEpisode = getSeasonAndEpisodeNumberForEpisodeId(resumeContentId!, seasons);
    }
  } else {
    // episode page
    resumeContentId = String(contentId);
    if (history.episodes) {
      // contentId is string in props, but is integer in history.episodes
      const itemIndex = findIndex(history.episodes as HistoryEpisode[], (entry) => `${entry.contentId}` === contentId);
      const item = itemIndex < 0 ? null : (history.episodes[itemIndex] as HistoryEpisode);
      if (item) {
        resumePosition = getResumePositionFromHistory(item);
      }
    } else {
      resumePosition = history.position;
    }
  }

  let resumeContent;
  if (resumeContentId) {
    resumeContent = byId[resumeContentId] as Video;
  }

  // if it can't be found in `byId` or the series' metadata, it must have gone out of window, so return same as no history
  if (!resumeContent && (!isSeries || !seasonAndEpisode)) {
    return resumeInfo;
  }
  let duration: number = 0;
  let title: string = '';
  if (resumeContent) {
    const { credit_cuepoints: creditCuepoints } = resumeContent;
    duration = resumeContent.duration;
    title = resumeContent.title;
    const postlude = computeCreditTime(duration, creditCuepoints);

    // return empty in either of: content_is_finished, duration_is_zero_or_nullish
    if (!duration || resumePosition > postlude) {
      return resumeInfo;
    }
  }

  let leftTimeText: string;
  if (isSeries) {
    if (seasonAndEpisode) {
      leftTimeText = [
        `${formatMessage(messages.season)} ${seasonAndEpisode.season}`,
        `${formatMessage(messages.episode)} ${seasonAndEpisode.episode}`,
      ].join(', ');
    } else {
      // Final fallback is to pull it out of the title like before, but this should not be necessary.
      leftTimeText = title?.split(' - ')[0]
        .replace(/^S0*/, `${formatMessage(messages.season)} `)
        .replace(/:E0*/, `, ${formatMessage(messages.episode)} `);
    }
  } else {
    leftTimeText = `${durationToHourAndMinute(
      duration - resumePosition,
      ` ${formatMessage(messages.hour)}`,
      ` ${formatMessage(messages.min)}`,
    )} ${formatMessage(messages.left)}`;
  }
  return {
    ...resumeInfo,
    contentId: resumeContentId,
    position: resumePosition,
    percentComplete: duration > 0 ? resumePosition / duration : undefined,
    leftTimeText,
  };
};
