import { getLocalData } from 'client/utils/localDataStorage';
import { AUTH_ERROR_TIMESTAMP_KEY } from 'common/constants/constants';
import type { PurpleCarpetState } from 'common/features/purpleCarpet/reducer';
import type { Video } from 'common/types/video';

import { PurpleCarpetContentStatus, PurpleCarpetStatus } from './type';

export const getExactTimeFromListing = (listing: PurpleCarpetState['listing'], id: string) => {
  let startTime: number | undefined;
  let endTime: number | undefined;

  const dates = listing.filter(item => item.tubi_id === id);

  if (dates.length > 1) {
    startTime = Math.min(...dates.map(date => new Date(date.startDate).getTime()));
    endTime = Math.max(...dates.map(date => new Date(date.endDate).getTime()));
  } else if (dates.length === 1) {
    startTime = new Date(dates[0].startDate).getTime();
    endTime = new Date(dates[0].endDate).getTime();
  }

  return { startTime, endTime };
};

export const getPurpleCarpetContentStatus = ({
  currentDate,
  listing,
  content,
}:{
  currentDate: Date,
  listing: PurpleCarpetState['listing'],
  content?: Video,
}) => {
  if (!content) {
    return PurpleCarpetContentStatus.Ended;
  }
  const listingTime = getExactTimeFromListing(listing, content.id);
  const { endTime } = listingTime;
  const startTime = listingTime.startTime || (content.air_datetime ? new Date(content.air_datetime!).getTime() : undefined);
  const currentDateInMS = currentDate.getTime();
  if (startTime && startTime > currentDateInMS) {
    return PurpleCarpetContentStatus.NotStarted;
  }
  if (!endTime || endTime < currentDateInMS) {
    return PurpleCarpetContentStatus.Ended;
  }
  return PurpleCarpetContentStatus.Live;
};

export const getPurpleCarpetStatusFromMainGame = ({
  hasContents,
  hasBanner,
  mainGameStatus,
}: {
  hasContents: boolean,
  hasBanner: boolean,
  mainGameStatus?: PurpleCarpetContentStatus,
}) => {
  if (hasBanner) {
    return PurpleCarpetStatus.Banner;
  }
  if (!hasContents) {
    return PurpleCarpetStatus.NotAvailable;
  }
  switch (mainGameStatus) {
    case PurpleCarpetContentStatus.NotStarted: {
      return PurpleCarpetStatus.BeforeGame;
    }
    case PurpleCarpetContentStatus.Live: {
      return PurpleCarpetStatus.DuringGame;
    }
    case PurpleCarpetContentStatus.Ended:
    default:
      return PurpleCarpetStatus.NotAvailable;
  }
};

export const purpleCarpetSettings = {
  // We have added the `__CLIENT__` check, so it fine to use `getLocalData` here
  // eslint-disable-next-line tubitv/no-client-folder-code-in-module-scope
  canBypassRegistration: __CLIENT__ && !!getLocalData(AUTH_ERROR_TIMESTAMP_KEY),
};

export const isPurpleCarpetContent = (video: Video) => video.player_type === 'fox';
