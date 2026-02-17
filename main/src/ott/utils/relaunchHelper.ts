import type { QueryStringParams } from '@adrise/utils/lib/queryString';
import { addQueryStringToUrl, getQueryStringFromUrl, parseQueryString } from '@adrise/utils/lib/queryString';
import { days, secs } from '@adrise/utils/lib/time';
import type { Request } from 'express';

import { getCookie, removeCookie, setCookie } from 'client/utils/localDataStorage';
import { REDIRECT_FROM, REDIRECT_FROM_VALUE, RESUME_TIME_QUERY } from 'common/constants/constants';
import { COOKIE_RELAUNCH_INFO } from 'common/constants/cookies';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import { tryJSONParse } from 'common/utils/jsonTools';
import { isOTTLiveNewsUrl, isOTTPlaybackUrl } from 'common/utils/urlPredicates';

import { isVideoExpired } from './expiration';

interface BaseRelaunchParams {
  path: string;
}
interface RelaunchLinearParams extends BaseRelaunchParams {
  type: REDIRECT_FROM_VALUE.RELAUNCH_LINEAR;
}
export interface RelaunchVODParams extends BaseRelaunchParams {
  type: REDIRECT_FROM_VALUE.RELAUNCH_VOD;
  position?: number;
  availability_ends?: string | null;
  nextId?: string;
  isCompleted?: boolean;
}

export type RelaunchParams = RelaunchLinearParams | RelaunchVODParams;

let _info: RelaunchParams | null = null;

export const getRelaunchInfo = (req?: Request) => {
  const relaunchInfoFromCookie = req ? req.cookies[COOKIE_RELAUNCH_INFO] : getCookie(COOKIE_RELAUNCH_INFO);
  return relaunchInfoFromCookie ? tryJSONParse(relaunchInfoFromCookie) : null;
};

export const saveRelaunchInfo = (params: RelaunchParams, isLoggedIn = false) => {
  _info = params;
  setCookie(
    COOKIE_RELAUNCH_INFO,
    JSON.stringify(params),
    getExpiredTime(params.type, isLoggedIn)
  );
};

export const updateRelaunchInfo = (params: Pick<RelaunchVODParams, 'path' | 'position' | 'nextId' | 'isCompleted'>, isLoggedIn = false) => {
  if (params.path === _info?.path) {
    saveRelaunchInfo({
      ..._info,
      ...params,
    } as RelaunchParams, isLoggedIn);
  }
};

export const clearRelaunchInfo = () => {
  _info = null;
  removeCookie(COOKIE_RELAUNCH_INFO);
};

export const getExpiredTime = (type: REDIRECT_FROM_VALUE, isLoggedIn = false) => {
  // save the vod relaunch info 14 days for registered users and 1 day for guest users.
  // the difference for guest users is because of privacy: guest user processes can only be stored for 24 hours.
  return days(type === REDIRECT_FROM_VALUE.RELAUNCH_VOD && !isLoggedIn ? 1 : 14) / secs(1);
};

export const isFromRelaunch = (url: string) => {
  const query = parseQueryString(getQueryStringFromUrl(url));
  switch (query[REDIRECT_FROM]) {
    case REDIRECT_FROM_VALUE.RELAUNCH_LINEAR:
    case REDIRECT_FROM_VALUE.RELAUNCH_VOD:
      return true;
    default:
      return false;
  }
};

export const getRelaunchUrl = (req?: Request) => {
  const relaunchInfo = getRelaunchInfo(req);
  if (!relaunchInfo) return;

  if (relaunchInfo.type === REDIRECT_FROM_VALUE.RELAUNCH_LINEAR && isOTTLiveNewsUrl(relaunchInfo.path)) {
    return addRelaunchParamsToUrl(relaunchInfo.path, relaunchInfo);
  }

  if (relaunchInfo.type === REDIRECT_FROM_VALUE.RELAUNCH_VOD && isOTTPlaybackUrl(relaunchInfo.path)) {
    const { path, nextId, isCompleted, availability_ends = null } = relaunchInfo;
    // if the content is expired, redirect to home page.
    if (isVideoExpired({ availability_ends })) {
      return null;
    }

    // if the content is completed, redirect to the next episode playback page.
    if (isCompleted) {
      return nextId ? addRelaunchParamsToUrl(getPlayerUrl(nextId), relaunchInfo, true) : null;
    }

    return addRelaunchParamsToUrl(path, relaunchInfo);
  }
};

const addRelaunchParamsToUrl = (url: string, relaunchInfo: RelaunchParams, redirect = false) => {
  const queryParams: QueryStringParams<string> = {
    [REDIRECT_FROM]: relaunchInfo.type,
  };
  // resume the position for last viewed VOD content
  if (!redirect && relaunchInfo.type === REDIRECT_FROM_VALUE.RELAUNCH_VOD && relaunchInfo.position) {
    queryParams[RESUME_TIME_QUERY] = relaunchInfo.position.toString();
  }

  return addQueryStringToUrl(url, queryParams);
};
