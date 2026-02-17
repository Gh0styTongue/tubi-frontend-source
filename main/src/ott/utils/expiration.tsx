import type { Video } from 'common/types/video';
import { timeDiffInDays } from 'common/utils/date';

type VideoExpirationDates = Pick<Video, 'availability_starts' | 'availability_ends' | 'availability_duration'>;

export const getDaysRemaining = ({
  availability_starts: starts,
  availability_ends: ends,
  availability_duration: durationInSeconds,
}: VideoExpirationDates): number => {
  const now = new Date();

  if (starts) {
    const startDate = new Date(starts);
    if (startDate > now) {
      return 0;
    }
  }

  const endDate = ends
    ? new Date(ends)
    : durationInSeconds != null
      ? new Date(now.getTime() + durationInSeconds * 1000)
      : null;

  if (!endDate) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(timeDiffInDays(endDate, now), 0);
};

export const isVideoExpired = (video: VideoExpirationDates) => getDaysRemaining(video) === 0;
