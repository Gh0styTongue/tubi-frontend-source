import type { QueryStringParams } from '@adrise/utils/lib/queryString';
import { queryStringify } from '@adrise/utils/lib/queryString';

import { getRainmakerAlias } from 'common/constants/platforms';
import conf from 'src/config';

import type { GetAdQueryParams } from './getAdQueryObject';

const { rainmakerUrl, rainmakerIPv4OnlyUrl } = conf;

export const getAdUrlByQueryObject = (queryObject: QueryStringParams<GetAdQueryParams>, useIPv4OnlyServer?: boolean, needAuth?: boolean) => {
  const host = useIPv4OnlyServer ? rainmakerIPv4OnlyUrl : rainmakerUrl;
  const path = needAuth ? 'v2/rev/vod' : 'api/v2/rev/vod';
  return `${host}/${path}/${getRainmakerAlias()}?${queryStringify(queryObject)}`;
};
