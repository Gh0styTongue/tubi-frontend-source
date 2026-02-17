import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { fetchEpgProgramming } from 'common/api/epg';
import {
  LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS,
  LOAD_WATCH_SCHEDULE_PROGRAMMING,
  LOAD_WATCH_SCHEDULE_PROGRAMS,
  RESET_WATCH_SCHEDULE,
  SET_WATCH_SCHEDULE_DATES,
  SET_WATCH_SCHEDULE_NOW,
} from 'common/constants/action-types';
import logger from 'common/helpers/logging';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { DATE_FORMAT, METADATA, WATCH_SCHEDULE_CONTENT_IDS } from 'web/features/watchSchedule/constants/landing';
import { datesSelector, featuredEpgContentIdsSelector } from 'web/features/watchSchedule/selectors/landing';
import type { RouteParams } from 'web/features/watchSchedule/types/landing';

dayjs.extend(utc);

interface FetchProgrammingParams extends RouteParams {
  lookahead: number;
}

export const fetchProgramming = ({ title: titleParam, lookahead }: FetchProgrammingParams) => {
  return (dispatch: TubiThunkDispatch) => {
    const { title } = METADATA[titleParam];
    const contentIds = WATCH_SCHEDULE_CONTENT_IDS[titleParam];

    return dispatch({
      type: LOAD_WATCH_SCHEDULE_PROGRAMMING,
      contentIds,
      title,
      titleParam,
      payload: () => {
        return dispatch(fetchEpgProgramming({
          contentIds,
          lookahead,
        }))
          .then((r) => r.rows)
          .catch((err) => {
            logger.error(err, `fetchProgramming failed. contentIds: ${contentIds.join(',')}; titleParam: ${titleParam}`);
            return Promise.reject(err);
          });
      },
    });
  };
};

interface FetchPrograms {
  contentIds: number[];
  date: string;
}

export const fetchPrograms = ({ contentIds, date }: FetchPrograms) => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const dates = datesSelector(state);

    if (dates.includes(date)) {
      return Promise.resolve();
    }

    return dispatch({
      type: LOAD_WATCH_SCHEDULE_PROGRAMS,
      date,
      contentIds,
      payload: () => {
        return dispatch(fetchEpgProgramming({
          contentIds,
          date,
        }))
          .then((r) => r.rows)
          .catch((err) => {
            logger.error(err, `fetchPrograms failed. contentIds: ${contentIds.join(',')}; date: ${date}`);
            return Promise.reject(err);
          });
      },
    });
  };
};

interface BatchFetchProgramsParams {
  contentIds: number[];
  dispatch: TubiThunkDispatch;
  lastDate: string;
  lookahead: number;
}

export const batchFetchPrograms = ({ contentIds, dispatch, lastDate, lookahead }: BatchFetchProgramsParams) => {
  const promises = Array.from({
    length: lookahead,
  }).map((_, idx) => {
    const date = dayjs(lastDate)
      .add(idx + 1, 'day')
      .format(DATE_FORMAT);

    return new Promise(() =>
      dispatch(
        fetchPrograms({
          contentIds,
          date,
        })
      )
    );
  });

  return Promise.all(promises);
};

export const fetchFeaturedProgrammings =
  () => (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const featuredEpgContentIds = featuredEpgContentIdsSelector(state);
    const contentIdsStr = featuredEpgContentIds.join(',');

    return dispatch({
      type: LOAD_WATCH_SCHEDULE_FEATURED_PROGRAMMINGS,
      payload: () => {
        return dispatch(
          fetchEpgProgramming({
            contentIds: featuredEpgContentIds,
          }))
          .then((r) => r.rows)
          .catch((err) => {
            logger.error(err, `fetchFeaturedProgrammings failed. contentIds: ${contentIdsStr}`);
            return Promise.reject(err);
          });
      },
    });
  };

export const setNow = (now: Dayjs) => ({
  type: SET_WATCH_SCHEDULE_NOW,
  now: now.toISOString(),
});

export const setDates = (days: Dayjs[]) => {
  const dates = days.map((day) => day.utc().format(DATE_FORMAT));

  return {
    type: SET_WATCH_SCHEDULE_DATES,
    dates,
  };
};

export const reset = () => ({
  type: RESET_WATCH_SCHEDULE,
});
