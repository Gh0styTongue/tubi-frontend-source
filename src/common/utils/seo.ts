import { ottDeeplinkLaunchPoint } from 'common/constants/ott-deeplink';

/**
 * process title for url slug
 * @param title
 * @returns {string} encoded url
 */
export const encodeTitle = (title?: string): string => {
  if (!title) return '';

  const res = title
    .trim()
    .replace(/^[_&]+|[_&]$/g, '')
    .replace(/&+/g, '-')
    .replace(/:+/g, '-')
    .replace(/_+/g, '-')
    .replace(/[\s.+,:/-]+/g, '-')
    .replace(/&/g, '-')
    .replace(/[^\w]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .toLowerCase();

  return encodeURIComponent(res);
};

/**
 * converts a name to SEO friendly url format
 * @param {String} name to convert
 * @returns {String} encoded name
 */
export const encodePersonName = (name: string): string => {
  if (!name) return '';

  // regex that deals with accented characters taken from https://stackoverflow.com/a/26900132/507784
  return `person-${name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-zÀ-ÖØ-öø-ÿ -]+/g, '')
    .replace(/\s+/g, '-')}`;
};

/**
 * converts url format name back into readable name
 * @param {String} name from url
 * @param {Boolean} quotes wrap in quotes or not
 * @returns {String} decoded name
 */
export const decodePersonName = (name: string, quotes = true): string => {
  if (!name) return '';

  const formattedName = name
    .split(/-+/g)
    .slice(1) // gets rid of the leading "person" word
    .filter((word) => word !== '') // gets rid of empty strings
    .map((word) => word[0].toLocaleUpperCase() + word.substring(1)) // capitalizes words
    .join(' ');

  return quotes ? `"${formattedName}"` : formattedName;
};

export const encodeDeeplinkString = (str: string, options: { launchPoint: string }) => {
  switch (options.launchPoint) {
    case ottDeeplinkLaunchPoint.Search:
      return str.replace(/\+/g, ' ');
    case ottDeeplinkLaunchPoint.Section:
      return str.replace(/\+/g, '_').replace(/\s/g, '_').toLowerCase();
    default:
      return str;
  }
};
