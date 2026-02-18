import template from 'lodash/template';

import { TITLE_TAG_MAX_LENGTH } from 'common/constants/constants';
import { trimStartSlash, trimTrailingSlash } from 'common/utils/urlManipulation';
import { LOCALE_URL_PREFIXES } from 'i18n/constants';
import type { FaqPageItem } from 'web/features/seo/components/FaqPageSchema/FaqPageSchema';

interface FaqItem {
  title: string;
  detail: string;
}

interface ParamData {
  [key: string]: string;
}

interface GetSEOPageTitleParams {
  title: string;
  prefix?: string;
  SEOCopy?: string;
  limit?: number;
}

export const HOST = 'https://tubitv.com';

// format pageTitle - maintain full SEOCopy prop and shorten title prop to satisfy character limit
export const getSEOPageTitle = ({
  title,
  prefix = 'Watch',
  SEOCopy = '- Free TV Shows | Tubi',
  limit = TITLE_TAG_MAX_LENGTH,
}: GetSEOPageTitleParams) => {
  const genComprisedTitle = (shortenedTitle: string) => [prefix, shortenedTitle, SEOCopy].filter(Boolean).join(' ');
  const comprisedTitle = genComprisedTitle(title);

  if (comprisedTitle.length <= limit) {
    return comprisedTitle;
  }

  const excess = comprisedTitle.length - limit;
  const shortenedTitle = title.substring(0, title.length - excess);

  return genComprisedTitle(shortenedTitle);
};

export const formatFaqItemsForSeo = (items: FaqItem[]): FaqPageItem[] => {
  return items.map(({ title, detail }) => ({ question: title, answer: detail }));
};

export const getTemplateString = (route: string) => {
  // The data object is used to allow undefined values.
  // See: https://github.com/jashkenas/underscore/issues/237#issuecomment-1781951
  // Also check how getCanonicalLink passes the data object to the template function.
  const templateString = route
    .replace(/\(\/:(\w+)\)/g, '<%= data.$1 ? "/" + data.$1 : "" %>')
    .replace(/(\/)?:(\w+)(\/)?/g, '$1<%= data.$2 %>$3');
  return templateString;
};

export const getPath = (route: string, data: ParamData) => {
  const templateString = getTemplateString(route);
  return template(templateString)({ data });
};

export const getCanonicalLink = (route: string, data: ParamData = {}) => {
  const path = getPath(route, data);
  return `${HOST}/${trimStartSlash(path)}`;
};

export const getCanonicalMetaByLink = (href: string) => ({ rel: 'canonical', href });

export const getCanonicalMeta = (path: string) => getCanonicalMetaByLink(getCanonicalLink(path));

export const getAlternateMeta = (pathname: string) => {
  const path = trimTrailingSlash(pathname);
  return [
    { rel: 'alternate', href: `${HOST}${path}`, hreflang: 'en-us' },
    ...LOCALE_URL_PREFIXES.map((locale) => ({
      rel: 'alternate',
      href: `${HOST}/${locale}${path}`,
      hreflang: locale,
    })),
    { rel: 'alternate', href: `${HOST}${path}`, hreflang: 'x-default' },
  ];
};
