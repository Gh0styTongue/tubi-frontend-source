import { convertToDate } from '@adrise/utils/lib/time';

import {
  EPG_EPISODE_PREFERRED_TITLE_KEYWORD,
  LINEAR_CONTENT_TYPE,
  LIVE_NEWS_CONTAINER_ID,
  NATIONAL_NEWS_CONTAINER_ID,
} from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import type { ChannelEPGInfo, Program } from 'common/types/epg';
import type { ImageResource, Video } from 'common/types/video';
import { getContentById } from 'common/utils/containerTools';
import type { ProgramDetails } from 'web/components/EPG/ProgramDetailsModal';

export const getWebEpgUrl = (id: string) => {
  // There is no 'live_news' container in epg containers so we hardcode to 'national_news'
  const containerId = id === LIVE_NEWS_CONTAINER_ID ? NATIONAL_NEWS_CONTAINER_ID : id;
  return `${WEB_ROUTES.live}#${containerId}`;
};

export const generateProgramKey = (channelId: string, program?: Program) => {
  if (program) {
    return `${channelId}-${program.title}-${program.start_time}`.replace(/\s+/g, '-');
  }
  return `${channelId}-program`;
};

export const transChannelInfo = ({
  id,
  channel,
  timelineStart,
  timelineEnd,
}: {
  id: string;
  channel?: ChannelEPGInfo;
  timelineStart: number;
  timelineEnd: number;
}) => {
  if (!channel) {
    return { id };
  }

  let programs = [
    {
      id: parseInt(channel.id, 10),
      programKey: generateProgramKey(channel.id),
      title: channel.title,
      description: channel.description,
    },
  ];

  if (channel.programs?.length) {
    programs = channel.programs
      ?.filter(({ start_time: startTime, end_time: endTime }) => {
        const programStart = convertToDate(startTime);
        const programEnd = convertToDate(endTime);

        return (
          programStart && programStart.getTime() < timelineEnd && programEnd && programEnd.getTime() > timelineStart
        );
      })
      .map((program) => {
        const title = getProgramRowTitle({
          keywords: program.keywords,
          title: program.title,
          episode_title: program.episode_title,
        });

        return {
          id: program.id,
          programKey: generateProgramKey(channel.id, program),
          title,
          description: program.description,
          startTime: program.start_time,
          endTime: program.end_time,
        };
      });
  }

  return {
    id,
    thumbnail: channel.images?.thumbnail?.[0],
    landscape: channel.images?.landscape?.[0],
    programs,
  };
};

// For title on row,
// if EPG_EPISODE_PREFERRED_TITLE_KEYWORD is given, we will use "episode title"(`episode_title`)
// otherwise, we do the opposite
export const getProgramRowTitle = ({
  keywords,
  title,
  episode_title,
}: {
  keywords?: string[];
  title: string;
  episode_title?: string;
}) => {
  if (!episode_title) {
    return title;
  }
  const hasPreferredEpisodeTitleKeyword = keywords?.includes(EPG_EPISODE_PREFERRED_TITLE_KEYWORD);
  return hasPreferredEpisodeTitleKeyword ? episode_title : title;
};

export const getCurrentProgram = (programs: Program[], currentDate: Date) =>
  programs.find((program) => new Date(program.end_time) > currentDate && new Date(program.start_time) < currentDate);

export const getLinearProgramTileImageUrl = (channel: Video, activeProgram?: Video, type: keyof ImageResource = 'landscape_images', fallbackType: keyof ImageResource = 'linear_larger_poster') => {
  const seriesBg =
    activeProgram?.series_images?.[type]?.[0] || activeProgram?.series_images?.[fallbackType]?.[0];
  const programBg = activeProgram?.images?.[type]?.[0] || activeProgram?.images?.[fallbackType]?.[0];
  const channelBg = channel.images?.[type]?.[0] || channel.images?.[fallbackType]?.[0];

  if (activeProgram && isEpisode(activeProgram)) {
    return seriesBg || channelBg || undefined;
  }

  return programBg || channelBg || undefined;
};

export const isLinearVideo = (video: Video) => video.type === LINEAR_CONTENT_TYPE;

const isEpisode = (video: Video) => Boolean(video.series_id);

export const findActiveSchedule = (channel: Video, now: number) =>
  channel.schedules?.find((schedule) => {
    const startTs = new Date(schedule.start_time).getTime();
    const endTs = new Date(schedule.end_time).getTime();

    return now > startTs && now < endTs;
  });

export const findActiveProgram = (channel: Video, byId: Record<string, Video>, now: number) => {
  const schedule = findActiveSchedule(channel, now);

  const program = schedule ? getContentById(byId, schedule.program_id) : undefined;

  return [schedule, program] as const;
};

export const getProgramDetailsByKey = (contentIds: string[], byId: Record<string, ChannelEPGInfo>) => {
  const programByKey: Record<string, ProgramDetails> = {};
  contentIds.forEach((id) => {
    const channel = byId[id];
    if (!channel) return;

    if (channel.programs?.length) {
      channel.programs?.forEach((program) => {
        const programKey = generateProgramKey(id, program);
        programByKey[programKey] = {
          title: program.title,
          subTitle: program.episode_title,
          channelId: id,
          backgroundImage: program.images.landscape[0],
          logoImage: channel.images?.thumbnail[0] || program.images.thumbnail[0],
          description: program.description,
          startTime: program.start_time,
          ratings: program.ratings,
          hasSubtitle: !!channel.has_subtitle,
          programId: program.id,
          programKey,
          keywords: program.keywords,
        };
      });
    } else {
      // If there is no programs in the channel, we use the channel details
      const programKey = generateProgramKey(id);
      programByKey[programKey] = {
        startTime: '',
        channelId: id,
        programKey,
        backgroundImage: channel.images?.landscape[0] ?? '',
        logoImage: channel.images?.thumbnail[0] ?? '',
        title: channel.title,
        description: channel.description,
        hasSubtitle: !!channel.has_subtitle,
      };
    }
  });
  return programByKey;
};
