import { WEB_ROUTES } from 'common/constants/routes';
import { encodeTitle } from 'common/utils/seo';
import { addLocalePrefix } from 'common/utils/urlManipulation';
import type { LocaleOptionType } from 'i18n/constants';
import conf from 'src/config';

// copied from urlConstructions to support the creatorverse content from /apps api
export const getDetailsUrlFromCreator = (options: {
  id: string;
  title: string;
  detailed_type?: string;
  preferredLocale?: LocaleOptionType;
  absolute?: boolean;
  host?: string;
}): string => {
  const {
    absolute,
    host,
    id,
    title,
    preferredLocale,
    detailed_type,
  } = options;

  const isSeries = detailed_type === 'series';
  const isEpisode = detailed_type === 'episode';
  const isLiveContent = detailed_type === 'linear';

  let prefix;

  if (isSeries) {
    prefix = '/series';
  } else if (isEpisode) {
    prefix = '/tv-shows';
  } else if (isLiveContent) {
    prefix = WEB_ROUTES.live;
  } else {
    prefix = '/movies';
  }

  let url = addLocalePrefix(preferredLocale, `${prefix}/${id}`);

  if (title) {
    url = `${url}/${encodeTitle(title)}`;
  }

  if (host) {
    url = host + url;
  } else if (absolute) {
    url = conf.prodHost + url;
  }

  return url;
};
