// the mapping of the current genre tags to container slug (as these tags have not changed in over a year)
// https://docs.google.com/spreadsheets/d/1PcsiEbLwlQdMwG__EW7SCAun6tTBxbXOe_jcO1M5zY0/edit#gid=971827833
// todo - replace this static mapping when API is ready
// Update: 2023-07
// https://docs.google.com/spreadsheets/d/1IxSTIMlUdbyLJg6Nt4-BEXSJjUF34mwAfBVAuZ_4rBY/edit#gid=0
export const GENRE_TAGS: Record<string, string> = {
  'Action': 'action',
  'Adventure': 'adventure',
  'Animation': 'shout-factory_animation',
  'Anime': 'anime',
  'Comedy': 'comedy',
  'Crime': 'crime_tv',
  'Documentary': 'documentary',
  'Drama': 'drama',
  'Fantasy': 'fantasy',
  'Foreign/International': 'foreign_films',
  'Holiday': 'holiday_movies',
  'Horror': 'horror',
  'Independent': 'indie_films',
  'Kids & Family': 'family_movies',
  'LGBT': 'lgbt',
  'Lifestyle': 'lifestyle_tv',
  'Music': 'music',
  'Musicals': 'musicals',
  'Mystery': 'mystery',
  'Reality': 'reality_tv',
  'Romance': 'romance',
  'Sci-Fi': 'sci_fi_and_fantasy',
  'Sport': 'sports_movies_and_tv',
  'Thriller': 'thrillers',
  'War': 'war_movies',
  'Western': 'westerns',
};

// Kids Mode
export const GENRE_TAGS_KIDS: Record<string, string> = {
  'Adventure': 'epic_adventures',
  'Animation': 'toon_tv',
  'Anime': 'kids_anime',
  'Comedy': 'kid_classics',
  'Drama': 'most_popular',
  'Kids & Family': 'family_movies',
  'Sport': 'games_and_sports',
};
