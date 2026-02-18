import { HISTORY_CONTAINER_ID } from './constants';

// key should never equal value, {queue: 'queue'} is not good
export const cmsToMatrixContainerMap = {
  history: HISTORY_CONTAINER_ID,
  1: 'trending',
  10: 'most_popular',
  1290: 'comedy',
  1291: 'drama',
  1293: 'romance',
  1295: 'documentary',
  1324: 'horror',
  1333: 'reality_tv',
  1413: 'foreign_favorites/s/korean_drama',
  1432: 'kids',
  1538: 'foreign_favorites',
  1562: 'foreign_favorites/s/special_interest/s/get_fit',
  1611: 'featured',
  1612: 'film_festival_favorites',
  1613: 'action',
  1643: 'new_arrivals',
  1851: 'not_on_netflix',
  1951: 'highly_rated_on_rotten_tomatoes',
  500001: 'featured', // formerly 'grindhouse' does not exist anymore
  500002: 'martial_arts',
  500006: 'tv_comedies',
  500007: 'tv_dramas',
  500008: 'cult_favorites',
  500009: 'sci_fi_and_fantasy',
  500011: 'fan_favorites',
  500012: 'foreign_favorites/s/british_tv',
  500013: 'crime_tv',
  500015: 'special_interest', // formerly 'extreme_adventures' does not exist anymore
  500016: 'special_interest/s/good_eats',
  500018: 'special_interest/s/wild_things', // formerly 'wild_things_nature'
  500020: 'special_interest/s/faith',
  500021: 'special_interest/s/music_and_musicals',
  500022: 'foreign_favorites/s/todo_en_espanol',
  500025: 'stand_up_comedy',
  500026: 'movie_night',
  500028: 'anime',
  500034: 'black_cinema', // formerly 'black_television_and_cinema'
  500035: 'impact',
  500037: 'foreign_favorites/s/chinese_drama',
  500040: 'featured', // formerly 'staff_picks' does not exist anymore
  500042: 'classics',
  500043: 'featured', // formerly 'political_fever'. found in Google Search Console
  500044: 'featured', // formerly 'holiday_movies' does not exist anymore
  500046: 'thrillers',
};
