import { programProgress, toAMOrPM } from '@adrise/utils/lib/time';
import type { TileOrientation } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, type IntlShape } from 'react-intl';

import TileBadge from 'common/components/TileBadge/TileBadge';
import { LINEAR_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import type { Video, VideoState } from 'common/types/video';
import type { LanguageLocaleType } from 'i18n/constants';

import { findActiveProgram, getLinearProgramTileImageUrl } from './epg';
import { getLanguageToShow } from './i18n';
import { generateRatingDescriptorString } from './ratings';
import { secondsToHoursAndMinutes } from './timeFormatting';

const messages = defineMessages({
  startedAt: {
    description: 'live sport event started at {time}',
    defaultMessage: 'Started at {time}',
  },
});

export interface ContentTileInfo {
  title: string;
  subTitle?: string;
  year?: number;
  rating?: string;
  descriptor?: string;
  cc?: boolean;
  duration?: string;
  timeLeft?: string;
  progress?: number;
  // genres
  tags: string[];
  // badges
  labels: React.ReactNode[];
  imageURL?: string;
  backgroundImage?: string;
  artTitle?: string;
}

export interface Params {
  content: Video;
  byId: VideoState['byId'];
  currentDate: Date;
  formatMessage: IntlShape['formatMessage'];
  userLanguageLocale: LanguageLocaleType;
  showLinearProgramsInRows?: boolean;
  tileOrientation?: TileOrientation;
}

export const getContentTileInfo = ({
  content,
  byId,
  currentDate,
  formatMessage,
  userLanguageLocale,
  showLinearProgramsInRows,
  tileOrientation,
}: Params) => {
  // video info
  const { title, year, type, tags, duration, ratings = [], has_subtitle: cc,
    landscape_images: [landscape] = [], posterarts: [poster] = [], images,
  } = content;

  // program info
  const isLinear = type === LINEAR_CONTENT_TYPE;
  const isProgram = showLinearProgramsInRows && isLinear;
  const [activeSchedule, activeProgram] = isProgram ? findActiveProgram(content, byId, currentDate.getTime()) : [];
  const {
    title: programTitle,
    type: programType,
    series_title: seriesTitle,
    year: programYear,
    tags: programTags,
    league: programLeague,
    lang: programLang,
    ratings: programRatings = [],
    has_subtitle: programCc,
  } = activeProgram || {};
  const { start_time: programStartTime, end_time: programEndTime, live: isLiveProgram } = activeSchedule || {};
  const { progress: programProgressPercentage, duration: programDuration, left: programLeftTime } = programProgress(programStartTime, programEndTime, currentDate) || {};
  const isSportsEvent = programType === SPORTS_EVENT_CONTENT_TYPE;
  const isEpisode = programType === VIDEO_CONTENT_TYPE && seriesTitle;

  // return result
  const contentTileInfo: ContentTileInfo = {
    title: programTitle || title,
    year: programYear || year,
    rating: programRatings[0]?.value || ratings[0]?.value,
    descriptor: generateRatingDescriptorString(programRatings[0]?.descriptors || ratings[0]?.descriptors),
    cc: programCc || cc,
    duration: secondsToHoursAndMinutes(programDuration || duration, { formatMessage }),
    timeLeft: secondsToHoursAndMinutes(programLeftTime, { formatMessage, remaining: true }),
    progress: programProgressPercentage,
    tags: programTags || tags || [],
    labels: [],
    imageURL: tileOrientation === 'landscape' ? (images?.landscape_images || [])[0] || landscape : (images?.posterarts || [])[0] || poster,
    artTitle: images?.title_art?.[0],
  };
  if (isProgram) {
    const programSrc = getLinearProgramTileImageUrl(content, activeProgram);
    if (programSrc) contentTileInfo.imageURL = programSrc;
    const backgroundImage = getLinearProgramTileImageUrl(content, activeProgram, 'backgrounds', 'backgrounds');
    if (backgroundImage) {
      contentTileInfo.backgroundImage = backgroundImage;
    }

    const languageToShow = getLanguageToShow(userLanguageLocale, programLang);
    if (languageToShow) {
      languageToShow
        .split(', ')
        .forEach((lang) => contentTileInfo.labels.push(<TileBadge type="language" language={lang} />));
    }
    if (isLiveProgram) {
      contentTileInfo.labels.push(<TileBadge type="live" />);
    } else if (activeSchedule) {
      contentTileInfo.labels.push(<TileBadge type="on-now" />);
    }

    if (isEpisode) {
      contentTileInfo.title = seriesTitle;
      contentTileInfo.subTitle = programTitle;
      contentTileInfo.year = undefined;
      contentTileInfo.duration = undefined;
    } else if (isSportsEvent) {
      contentTileInfo.year = undefined;
      if (isLiveProgram) {
        contentTileInfo.duration = formatMessage(messages.startedAt, { time: toAMOrPM(programStartTime) });
      }
      if (programLeague) {
        contentTileInfo.tags = [programLeague];
      }
    }
    contentTileInfo.tags = [...contentTileInfo.tags.slice(0, 1), title];
  }

  return contentTileInfo;
};
