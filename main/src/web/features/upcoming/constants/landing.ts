import { SERIES_CONTENT_TYPE, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import type { VideoType, Trailer } from 'common/types/video';

export const UPCOMING_TITLES = {
  BIG_MOOD: 'big-mood',
  SIDELINED: 'sidelined-the-qb-and-me',
  WE_GOT_TIME_TODAY: 'we-got-time-today',
  JOKES_ON_US: 'jokes-on-us',
  THE_Z_SUITE: 'the-z-suite',
};

export const UPCOMING_CONTENTS = {
  [UPCOMING_TITLES.BIG_MOOD]: {
    id: '300002663',
    type: SERIES_CONTENT_TYPE as VideoType,
    availability_starts: '2024-04-19T00:00:00.000Z',
    trailers: [{
      url: 'https://mcdn.tubitv.com/video/upcoming-trailers/big-mood.mp4',
    } as Trailer],
    tags: ['1 Season, 8 Episodes'],
  },
  [UPCOMING_TITLES.WE_GOT_TIME_TODAY]: {
    id: '300013864',
    type: SERIES_CONTENT_TYPE as VideoType,
    availability_starts: '2024-11-19T08:00:00.000Z',
    availability_starts_for_trailer: '2024-11-10T08:00:00.000Z',
    trailers: [{
      url: 'https://mcdn.tubitv.com/video/upcoming-trailers/we-got-time-today.mp4',
    } as Trailer],
    tags: ['1 Season'],
    locations: ['US', 'CA', 'UK'],
  },
  [UPCOMING_TITLES.SIDELINED]: {
    id: '100028262',
    type: VIDEO_CONTENT_TYPE as VideoType,
    availability_starts: '2024-11-29T08:00:00.000Z',
    availability_starts_for_trailer: '2024-10-29T08:00:00.000Z',
    trailers: [{
      url: 'https://mcdn.tubitv.com/video/upcoming-trailers/sidelined-the-qb-and-me.mp4',
    } as Trailer],
    locations: ['US', 'CA'],
  },
  [UPCOMING_TITLES.JOKES_ON_US]: {
    id: '100029856',
    type: VIDEO_CONTENT_TYPE as VideoType,
    availability_starts: '2024-12-05T08:00:00.000Z',
    availability_starts_for_trailer: '2024-11-21T08:00:00.000Z',
    trailers: [{
      url: 'https://mcdn.tubitv.com/video/upcoming-trailers/jokes-on-us.mp4',
    } as Trailer],
    locations: ['US', 'CA'],
  },
  [UPCOMING_TITLES.THE_Z_SUITE]: {
    id: '300014710',
    type: SERIES_CONTENT_TYPE as VideoType,
    availability_starts: '2025-02-06T08:00:00.000Z',
    availability_starts_for_trailer: '2025-01-22T08:00:00.000Z',
    trailers: [{
      url: 'https://mcdn.tubitv.com/video/upcoming-trailers/the-z-suite.mp4',
    } as Trailer],
    tags: ['1 Season'],
    locations: ['US', 'CA'],
  },
};
