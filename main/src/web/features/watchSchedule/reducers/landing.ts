import dayjs from 'dayjs';

import {
  LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS,
  LOAD_WATCH_SCHEDULE_PROGRAMMING,
  LOAD_WATCH_SCHEDULE_PROGRAMS,
  RESET_WATCH_SCHEDULE,
  SET_WATCH_SCHEDULE_DATES,
  SET_WATCH_SCHEDULE_NOW,
} from 'common/constants/action-types';
import type { EPGItemFromResponse } from 'common/types/epg';
import { DATE_FORMAT } from 'web/features/watchSchedule/constants/landing';
import type {
  FetchFeaturedProgrammingsSuccessAction,
  FetchProgrammingAction,
  FetchProgrammingSuccessAction,
  FetchProgramsAction,
  FetchProgramsSuccessAction,
  FetchProgramsFailureAction,
  SetDatesAction,
  SetNowAction,
  WatchScheduleAction as Action,
  WatchScheduleState as State,
} from 'web/features/watchSchedule/types/landing';
import { enrichProgramsWithContentId } from 'web/features/watchSchedule/utils/landing';

export const initialState: State = {
  title: '',
  titleParam: '',
  contentIds: [],
  now: '',
  dates: [],
  programmings: {},
  pending: {},
  isFeaturedEpgItemsLoading: false,
  isFeaturedEpgItemsLoaded: false,
  featuredEpgItems: [],
  loadMore: {
    isVisible: true,
    loading: {},
    isLoading: false,
  },
};

const getLoadingKey = (date: string, contentIds: number[]) => `${date}-${contentIds.join(',')}`;

const getIsLoading = (loading: State['loadMore']['loading']) => Object.values(loading).some(Boolean);

export default function reducer(state: State = initialState, action = {} as Action): State {
  switch (action.type) {
    case LOAD_WATCH_SCHEDULE_PROGRAMMING.FETCH: {
      const { contentIds, title, titleParam } = action as FetchProgrammingAction;

      return {
        ...state,
        contentIds,
        title,
        titleParam,
      };
    }

    case LOAD_WATCH_SCHEDULE_PROGRAMMING.SUCCESS: {
      const { payload } = action as FetchProgrammingSuccessAction;

      const programmings = payload.reduce<
        Record<number, EPGItemFromResponse & { programs: ReturnType<typeof enrichProgramsWithContentId> }>
      >((acc, programming) => {
        const { content_id: contentId, programs } = programming;

        acc[contentId] = {
          ...programming,
          programs: enrichProgramsWithContentId(programs, contentId),
        };

        return acc;
      }, {});

      return {
        ...state,
        programmings,
      };
    }

    case LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS.FETCH: {
      return {
        ...state,
        isFeaturedEpgItemsLoading: true,
      };
    }

    case LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS.SUCCESS: {
      const { payload: featuredEpgItems } = action as FetchFeaturedProgrammingsSuccessAction;

      return {
        ...state,
        isFeaturedEpgItemsLoading: false,
        isFeaturedEpgItemsLoaded: true,
        featuredEpgItems,
      };
    }

    case LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS.FAILURE: {
      return {
        ...state,
        isFeaturedEpgItemsLoading: false,
        isFeaturedEpgItemsLoaded: false,
      };
    }

    case LOAD_WATCH_SCHEDULE_PROGRAMS.FETCH: {
      const { date, contentIds } = action as FetchProgramsAction;
      const loading = { ...state.loadMore.loading, [getLoadingKey(date, contentIds)]: true };

      return {
        ...state,
        loadMore: {
          ...state.loadMore,
          loading,
          isLoading: true,
        },
      };
    }

    case LOAD_WATCH_SCHEDULE_PROGRAMS.SUCCESS: {
      const { date, contentIds, payload } = action as FetchProgramsSuccessAction;
      const { pending } = state;
      const dates = pending.dates || state.dates;
      const programmings = pending.programmings || state.programmings;

      // fetchPrograms may be called in batch. Therefore, when the SUCCESS callback is received,
      // we still need to ensure the dates list is in the correct order.
      const sortedDates = [...dates, date]
        .map(dayjs)
        .sort((a, b) => a.diff(b))
        .map((d) => d.format(DATE_FORMAT));

      const updatedProgrammings = contentIds.reduce((acc, contentId) => {
        const programming = payload.find((p) => p.content_id === contentId);

        if (!programming) {
          return acc;
        }

        const updatedPrograms = programmings[contentId]?.programs || [];
        const enhancedPrograms = enrichProgramsWithContentId(programming.programs, contentId);

        // Filter out programs that are already in the list. For more details, please refer to
        // https://app.shortcut.com/tubi/story/569386/add-date-based-pagination-to-epg-programming-endpoint#activity-585755
        for (const program of enhancedPrograms) {
          const index = updatedPrograms.findIndex((p) => p.id === program.id);
          if (index === -1) {
            updatedPrograms.push(program);
          }
        }

        acc[contentId] = {
          ...programming,
          programs: updatedPrograms,
        };

        return acc;
      }, state.programmings);

      const loading = { ...state.loadMore.loading };
      delete loading[getLoadingKey(date, contentIds)];

      const isLoading = getIsLoading(loading);
      const isVisible = payload.some((p) => p.programs.length > 0);

      let updated = {};
      if (isLoading) {
        updated = {
          pending: { ...state.pending, dates: sortedDates, programmings: updatedProgrammings },
        };
      } else {
        updated = {
          dates: sortedDates,
          programmings: updatedProgrammings,
          pending: {},
        };
      }

      return {
        ...state,
        ...updated,
        loadMore: {
          isLoading,
          isVisible,
          loading,
        },
      };
    }

    case LOAD_WATCH_SCHEDULE_PROGRAMS.FAILURE: {
      const { date, contentIds } = action as FetchProgramsFailureAction;

      const loading = { ...state.loadMore.loading };
      delete loading[getLoadingKey(date, contentIds)];

      return {
        ...state,
        loadMore: {
          ...state.loadMore,
          loading,
          isLoading: getIsLoading(loading),
        },
      };
    }

    case SET_WATCH_SCHEDULE_NOW: {
      const { now } = action as SetNowAction;

      return {
        ...state,
        now,
      };
    }

    case SET_WATCH_SCHEDULE_DATES: {
      const { dates } = action as SetDatesAction;

      return {
        ...state,
        dates,
      };
    }

    case RESET_WATCH_SCHEDULE: {
      return initialState;
    }

    default:
      return state;
  }
}
