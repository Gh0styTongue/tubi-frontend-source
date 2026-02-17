import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { createSelector } from 'reselect';

import {
  LIVE_CONTENT_MODES,
  FEATURED_CONTAINER_ID,
  FREEZED_EMPTY_OBJECT,
  FREEZED_EMPTY_ARRAY,
} from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { containerLoadIdMapSelector, containerChildrenIdMapSelector } from 'common/selectors/container';
import type { StoreState } from 'common/types/storeState';
import { encodeTitle } from 'common/utils/seo';
import { getPath } from 'web/features/seo/utils/seo';
import {
  DATE_FORMAT,
  FEATURED_CONTENTS_LIMIT,
  METADATA,
  WATCH_SCHEDULE_TITLES,
  SPORTS_EVENT_TITLES,
  TOP_EPG_CONTENTS_LIMIT,
} from 'web/features/watchSchedule/constants/landing';
import type { Program } from 'web/features/watchSchedule/types/landing';
import { orderByStartTime } from 'web/features/watchSchedule/utils/landing';

const watchScheduleSelector = ({ watchSchedule }: StoreState) => watchSchedule;

const programmingsSelector = createSelector(watchScheduleSelector, ({ programmings }) => programmings);

export const contentIdsSelector = createSelector(watchScheduleSelector, ({ contentIds }) => contentIds);

export const titleSelector = createSelector(watchScheduleSelector, ({ title }) => title);

export const titleParamSelector = createSelector(watchScheduleSelector, ({ titleParam }) => titleParam);

export const programmingByContentIdSelector = createSelector(
  programmingsSelector,
  (_: StoreState, contentId: number) => contentId,
  (programmings, contentId) => programmings[contentId]
);

export const programsSelector = createSelector(watchScheduleSelector, ({ contentIds, title, programmings }) => {
  const allPrograms = contentIds.reduce<Program[]>((acc, contentId) => {
    const { programs = [] } = programmings[contentId] || {};
    return [...acc, ...programs];
  }, []);

  let filterBy = (program: Program) => program.title.toLowerCase() === title.toLowerCase();

  if (title === METADATA[WATCH_SCHEDULE_TITLES.CONCACAF].title) {
    filterBy = (program: Program) => /concacaf/i.test(program.title);
  }

  return allPrograms.filter(filterBy);
});

export const programsGroupByDateSelector = createSelector(programsSelector, (programs) => {
  const programsGroupByDate = programs.reduce((acc, program) => {
    const date = dayjs(program.start_time).format(DATE_FORMAT);

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(program);

    return acc;
  }, {} as Record<string, typeof programs>);

  for (const programs of Object.values(programsGroupByDate)) {
    programs.sort(orderByStartTime);
  }

  return programsGroupByDate;
});

export const upcomingProgramSelector = createSelector(
  programsSelector,
  (_: StoreState, now: Dayjs) => now,
  (programs, now) => {
    const featurePrograms = programs
      .filter((program) => {
        return dayjs(program.end_time).isAfter(now);
      })
      .sort(orderByStartTime);
    return featurePrograms[0] as Program | undefined;
  }
);

export const containerContentIdsLoadStatusSelector = createSelector(
  [containerLoadIdMapSelector, (_state, { containerId = FEATURED_CONTAINER_ID }: {containerId?: string} = {}) => containerId],
  (loadIdMap, containerId) => loadIdMap[containerId] || FREEZED_EMPTY_OBJECT
);

export const containerContentIdsSelector = createSelector(
  [containerChildrenIdMapSelector, (_state, { containerId = FEATURED_CONTAINER_ID }: {containerId?: string} = {}) => containerId],
  (idMap, containerId) => {
    const contentIds = idMap[containerId];
    return contentIds ? contentIds.slice(0, FEATURED_CONTENTS_LIMIT) : FREEZED_EMPTY_ARRAY;
  }
);

const epgChannelsByCategorySelector = ({ epg }: StoreState) => epg.contentIdsByContainer[LIVE_CONTENT_MODES.all];

export const featuredEpgContentIdsSelector = createSelector(epgChannelsByCategorySelector, (channels) => {
  const featuredChannels = channels.filter((channel) =>
    ['featured_channels', 'recently_added_channels', 'national_news'].includes(channel.container_slug)
  );

  const contentIds = new Set<string>();

  featuredChannels.forEach((channel) => {
    channel.contents.forEach((contentId) => {
      contentIds.add(contentId);
    });
  });

  return Array.from(contentIds).slice(0, TOP_EPG_CONTENTS_LIMIT);
});

export const featuredEpgItemsLoadingSelector = createSelector(
  watchScheduleSelector,
  ({ isFeaturedEpgItemsLoading }) => isFeaturedEpgItemsLoading
);

export const featuredEpgItemsLoadedSelector = createSelector(
  watchScheduleSelector,
  ({ isFeaturedEpgItemsLoaded }) => isFeaturedEpgItemsLoaded
);

export const featuredEpgItemsSelector = createSelector(
  watchScheduleSelector,
  ({ featuredEpgItems }) => featuredEpgItems
);

export const nowSelector = createSelector(watchScheduleSelector, ({ now }) => dayjs(now));

export const datesSelector = createSelector(watchScheduleSelector, ({ dates }) => dates);

export const lastDateSelector = createSelector(datesSelector, (dates) => dates[dates.length - 1]);

export const loadMoreSelector = createSelector(watchScheduleSelector, ({ loadMore }) => loadMore);

export const isSportsEventSelector = createSelector(titleParamSelector, (titleParam) =>
  SPORTS_EVENT_TITLES.includes(titleParam)
);

export const liveChannelUrlSelector = createSelector(
  programmingsSelector,
  (_: StoreState, contentId: number) => contentId,
  (programmings, contentId) => {
    const programming = programmings[contentId];
    return getPath(WEB_ROUTES.liveDetail, { id: `${contentId}`, title: encodeTitle(programming.title) });
  }
);

/**
 * @example ['2023-10-29', ['2023-10-30', '2023-10-31'], '2023-11-01']
 * The date array indicates that there are no scheduled programs for the consecutive dates ranging
 * from 2023-10-30 to 2023-10-31. The other date strings like 2023-10-29 either have scheduled programs
 * or are not consecutive dates.
 */
export const consecutiveNoScheduledDatesSelector = createSelector(
  programsGroupByDateSelector,
  datesSelector,
  (programsGroupByDate, dates) => {
    const scheduledDates = Object.keys(programsGroupByDate);
    const consecutiveDates: (string[] | string)[] = [];
    let lastConsecutiveDatesIndex = 0;

    dates.forEach((date) => {
      if (scheduledDates.includes(date)) {
        consecutiveDates.push(date);
        lastConsecutiveDatesIndex += 2;
      } else {
        if (!consecutiveDates[lastConsecutiveDatesIndex]) {
          consecutiveDates[lastConsecutiveDatesIndex] = [date];
        } else {
          const lastConsecutiveDates = consecutiveDates[lastConsecutiveDatesIndex];
          const lastDate = dayjs(lastConsecutiveDates[lastConsecutiveDates.length - 1]);

          if (lastDate.add(1, 'day').isSame(date)) {
            (lastConsecutiveDates as string[]).push(date);
          } else {
            consecutiveDates.push([date]);
            lastConsecutiveDatesIndex += 1;
          }
        }
      }
    });

    return consecutiveDates.filter(Boolean).map((date) => {
      if (typeof date === 'string') {
        return date;
      }

      if (date.length === 1) {
        return date[0];
      }

      return date;
    });
  }
);
