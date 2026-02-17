import { GENRE_TAGS, GENRE_TAGS_KIDS } from 'common/constants/genre-tags';

import { getContainerUrl } from './urlConstruction';

/**
 * Return a url of the clickable genre tag
 * If there is no mapped container, use search page as a fallback
 */
export const getGenreLinkUrl = (genre: string, isKidsModeEnabled = false) => {
  const slug = isKidsModeEnabled ? GENRE_TAGS_KIDS[genre] : GENRE_TAGS[genre];
  if (slug) {
    return getContainerUrl(slug);
  }
  return `/search/${encodeURIComponent(genre)}`;
};

export const hasGenreContainer = (genre: string, isKidsModeEnabled = false) => {
  const slug = isKidsModeEnabled ? GENRE_TAGS_KIDS[genre] : GENRE_TAGS[genre];
  return !!slug;
};
