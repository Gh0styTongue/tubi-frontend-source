import { addQueryStringToUrl, parseQueryString } from '@adrise/utils/lib/queryString';
import { ActionStatus } from '@tubitv/analytics/lib/authEvent';
import type { Request } from 'express';
import isEmpty from 'lodash/isEmpty';

import { SIGN_OUT_STATUS } from 'common/constants/constants';
import { makeFullUrl } from 'common/utils/urlManipulation';

import { PERSISTED_QUERY_PARAMS_NAMESPACE } from '../constants/persistedQueryParams';
import type { PersistedQueryParams } from '../types/persistedQueryParams';

export const getPersistedQueryParams = (req?: Request) => {
  let paramsString: string | undefined = '';
  if (__CLIENT__) {
    return parseQueryString(window.location.search)[PERSISTED_QUERY_PARAMS_NAMESPACE] || {};
  }
  if (__SERVER__ && req) {
    paramsString = req.query?.[PERSISTED_QUERY_PARAMS_NAMESPACE] as string;
  }

  if (!paramsString) {
    return {};
  }

  try {
    return JSON.parse(paramsString as string);
  } catch (e) {
    return {};
  }
};

export const redirectAfterLogout = ({
  isByUser,
  persistedQueryParams,
  hasError,
  path,
}: {
  isByUser?: boolean;
  persistedQueryParams: PersistedQueryParams;
  hasError: boolean;
  path: string;
}) => {
  let nextPath = path;
  if (!isEmpty(persistedQueryParams)) {
    nextPath = addQueryStringToUrl(nextPath, {
      [PERSISTED_QUERY_PARAMS_NAMESPACE]: persistedQueryParams,
    });
  }
  if (isByUser) {
    nextPath = addQueryStringToUrl(nextPath, {
      [SIGN_OUT_STATUS]: hasError ? ActionStatus.FAIL : ActionStatus.SUCCESS,
    });
  }
  window.location.href = makeFullUrl(nextPath);
};
