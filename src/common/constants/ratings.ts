export const PARENTAL_RATINGS = [
  {
    title: 'Little Kids',
    ratings: ['G', 'TV-Y', 'TV-G'],
  },
  {
    title: 'Older Kids',
    ratings: ['PG', 'TV-PG', 'TV-Y7'],
  },
  {
    title: 'Teens',
    ratings: ['PG-13', 'TV-14'],
  },
  {
    title: 'Adults',
    ratings: ['R', 'TV-MA', 'NR', 'NC-17'],
  },
];

export enum ParentalRating {
  LKIDS = 0,
  OKIDS,
  TEENS,
  ADULTS,
}
