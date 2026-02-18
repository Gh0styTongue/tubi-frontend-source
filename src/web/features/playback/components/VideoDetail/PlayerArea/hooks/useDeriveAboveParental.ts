import { ParentalRating } from 'common/constants/ratings';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { isKidsModeSelector } from 'common/selectors/ui';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import type { Video } from 'common/types/video';
import { isAboveParentalLevel } from 'common/utils/ratings';

export const useDeriveAboveParental = (video: Video) => {
  const isKidsModeEnabled = useAppSelector(isKidsModeSelector);
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const parentalRating = useAppSelector(parentalRatingSelector);
  const rating = video.ratings;

  const userRatingLevel =
    isKidsModeEnabled && (!isLoggedIn || (isLoggedIn && parentalRating === ParentalRating.ADULTS))
      ? // User is in kids mode but not logged in (no user setting)
    // OR
    // User is in kids mode with an Adult parental rating (enter from nav)
      ParentalRating.OKIDS
      : // Otherwise use setting
      parentalRating;

  return isAboveParentalLevel(userRatingLevel, rating);
};
