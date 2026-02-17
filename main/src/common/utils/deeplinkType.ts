import type { Query } from 'history';

import { getData } from 'client/utils/sessionDataStorage';
import { OTT_ROUTES } from 'common/constants/routes';
import { isOTTPlaybackUrl, isDetailsPageUrl, isOTTLiveNewsUrl, isHomeUrl, matchesRoute, isOTTOnboardingUrl } from 'common/utils/urlPredicates';
import { isFromRelaunch } from 'ott/utils/relaunchHelper';

import { getReferredExtraCtxFromQuery, getReferredExtraCtxFromDocument } from './track';

export enum DeeplinkType {
  None = 'none',
  Player = 'player',
  Live = 'live',
  Details = 'details',
  Home = 'home',
  Container = 'container',
  Search = 'search',
  Other = 'other',
}

export type SubRequest = {
  url: string;
  query: Record<string, unknown>;
  path: string;
};

export const getOTTDeeplinkType = ({ url, query: { utm_source }, path }: SubRequest) => {
  if (__ISOTT__ && utm_source) {
    // check if it is playback page
    if (isOTTPlaybackUrl(url || '')) {
      return DeeplinkType.Player;
    }
    // check if it is details page
    if (isDetailsPageUrl(url)) {
      return DeeplinkType.Details;
    }
    if (isOTTLiveNewsUrl(url)) {
      return DeeplinkType.Live;
    }
    if (isHomeUrl(url)) {
      return DeeplinkType.Home;
    }
    if (matchesRoute(OTT_ROUTES.containerDetail, path)) {
      return DeeplinkType.Container;
    }
    if (matchesRoute(OTT_ROUTES.search, path)) {
      return DeeplinkType.Search;
    }
    return DeeplinkType.Other;
  }
  return DeeplinkType.None;
};

export const isDeepLinkOnWeb = (query: Query): boolean => {
  const SEO_REFERRED_KEY = 'seo-referred';

  return (!!getReferredExtraCtxFromQuery(query)
    || !!getReferredExtraCtxFromDocument(query)
  ) && !getData(SEO_REFERRED_KEY);
};

export const shouldRenderIntroVideo = (request: SubRequest) => {
  const ottDeeplinkType = getOTTDeeplinkType(request);
  if (isHomeUrl(request.url) || isOTTOnboardingUrl(request.url) || isFromRelaunch(request.url)) {
    return true;
  }

  return [
    DeeplinkType.Player,
    DeeplinkType.Details,
    DeeplinkType.Container,
    DeeplinkType.Search,
  ].includes(ottDeeplinkType);
};
