import { queryStringify } from '@adrise/utils/lib/queryString';

import { getUrlParam } from 'common/utils/urlManipulation';

function setUrlParams(queryParams: Record<string, unknown>) {
  const queryParamString = queryStringify(queryParams);
  const newSearchString = queryParamString.length > 0 ? `?${queryParamString}` : '';
  window.history.replaceState(null, '', `${window.location.pathname}${newSearchString}`);
}

export function removeUrlParam(parameter: string) {
  const queryParams = { ...getUrlParam() };
  delete queryParams[parameter];
  setUrlParams(queryParams);
}

export function removeUrlParams(parameters: string[]) {
  const queryParams = { ...getUrlParam() };
  parameters.forEach(param => delete queryParams[param]);
  setUrlParams(queryParams);
}
