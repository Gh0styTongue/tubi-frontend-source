import type { MessageDescriptor } from 'react-intl';
import { defineMessages } from 'react-intl';
import type { ElementOf } from 'ts-essentials';

import { PARENTAL_RATINGS, ParentalRating } from 'common/constants/ratings';
import type StoreState from 'common/types/storeState';
import type { RatingDescriptor, VideoRating } from 'common/types/video';

const messages = defineMessages({
  littleKids: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Little Kids',
  },
  littleKidsUS: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Little Kids (G, TV-G, and TV-Y)',
  },
  olderKids: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Older Kids',
  },
  olderKidsUS: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Older Kids (PG, TV-PG, TV-Y7)',
  },
  teens: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Teens',
  },
  teensUS: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Teens (PG-13, TV-14)',
  },
  adults: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Adults',
  },
  adultsUS: {
    description: 'tv/movie ratings dropdown option for parental controls',
    defaultMessage: 'Adults (R, TV-MA, NR, and NC-17)',
  },
});

export interface ParentalRatingsDropdownValue {
  label: MessageDescriptor;
  value: string;
  rating: number;
}

export function getRatingsDropdownValues(isInGDPRCountry?: boolean, isUsCountry?: boolean): ParentalRatingsDropdownValue[] {
  return [
    {
      label: isUsCountry ? messages.littleKidsUS : messages.littleKids,
      value: 'LKIDS',
      rating: ParentalRating.LKIDS,
    },
    {
      label: isUsCountry ? messages.olderKidsUS : messages.olderKids,
      value: 'OKIDS',
      rating: ParentalRating.OKIDS,
    },
    {
      label: isUsCountry ? messages.teensUS : messages.teens,
      value: 'TEENS',
      rating: ParentalRating.TEENS,
    },
    {
      label: isUsCountry ? messages.adultsUS : messages.adults,
      value: 'ADULTS',
      rating: ParentalRating.ADULTS,
    },
  ].filter(item => {
    // We need to remove "TEENS" when user in GDPR country
    if (isInGDPRCountry && item.value === 'TEENS') {
      return false;
    }
    return true;
  });
}

/**
 * check whether ratings is mature content, non-ratings is consider mature
 * @param ratings
 * @param threshold - ParentalRating.ADULTS or ParentalRating.TEENS
 * @returns {boolean}
 */
export const isMatureContent = (ratings: VideoRating[] = [], threshold: ParentalRating.TEENS | ParentalRating.ADULTS = ParentalRating.ADULTS): boolean => {
  if (ratings.length === 0) return true;
  let list = ['R', 'NC-17', 'TV-MA'];
  if (threshold === ParentalRating.TEENS) {
    list = list.concat('PG-13', 'TV-14');
  }

  // the rating.code property, unlike rating.value, is normalized to the US
  // rating system
  return ratings.some(item => list.indexOf(item.code) !== -1);
};

/**
 * Because we can deep link movies above parental rating level; this checks that and doesn't allow
 * @param userRatingLevel - number -from parental controls, allowed level of content (0-4)
 * @param movieRatings - array - ratings of the current movie we are displaying
 * @returns {boolean}
 */
export const isAboveParentalLevel = (userRatingLevel: ParentalRating, movieRatings: VideoRating[] = []): boolean => {
  // if user is above 4, let them through as they can see anything
  if (userRatingLevel >= 4) return false;

  // if there is not movie rating, see if user rating is lower then 3
  if (movieRatings.length === 0) return userRatingLevel < 3;

  // pull out just the ratings
  const allowedRatings = PARENTAL_RATINGS.reduce((acc: string[], v: ElementOf<typeof PARENTAL_RATINGS>, i: number) =>
    (i > userRatingLevel ? acc : [...acc, ...v.ratings]), [] as string[]);
  // the rating.code property is normalized to the US rating system
  const currentRatings = movieRatings.map(v => v.code);

  return currentRatings.every((currentRating) => {
    const [rating] = currentRating.split('_'); // split "TV-Y7_FV" to ["TV-Y7", "FV"], because we only want ratings
    return allowedRatings.indexOf(rating) === -1;
  });
};

/**
 * Check if the user is in kids mode
 * The user is in kids mode if the parental rating is either
 * older kids or little kids
 * @param {*} parentalRating Parental rating
 */
export function isParentalRatingOlderKidsOrLess(parentalRating: number): boolean {
  return parentalRating <= ParentalRating.OKIDS;
}

export function isKidsModeOrIsParentalRatingOlderKidsOrLess(state: StoreState) {
  const { ui: { isKidsModeEnabled }, userSettings: { parentalRating } } = state;
  return isParentalRatingOlderKidsOrLess(parentalRating) || isKidsModeEnabled;
}

export function isParentalRatingTeensOrLess(parentalRating: number): boolean {
  return parentalRating <= ParentalRating.TEENS;
}

// returns a string of the rating descriptors, for example [S, D, L] would return 'SDL'
export const generateRatingDescriptorString = (ratingDescriptors: RatingDescriptor[] = [], withCommaSeparated?: boolean) => {
  if (!ratingDescriptors.length) return '';
  return ratingDescriptors.map((descriptor) => {
    return descriptor.code;
  }).join(withCommaSeparated ? ', ' : ' ');
};
