import type { GetOTTAdUrlOptions } from 'common/features/playback/utils/getAdQueryObject';
import { getAdUrlByQueryObject } from 'common/features/playback/utils/getAdUrlByQueryObject';

import { getOTTAdQueryObject } from './getOTTAdQueryObject';

export const getOTTAdUrl = ({
  useIPv4OnlyServer,
  ...restOptions
}: GetOTTAdUrlOptions) => {
  if (__SERVER__) return '';

  const queryObject = getOTTAdQueryObject(restOptions);

  return getAdUrlByQueryObject(queryObject, useIPv4OnlyServer);
};
