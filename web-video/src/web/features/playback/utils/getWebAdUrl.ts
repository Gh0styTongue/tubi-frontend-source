import { getAdQueryObject } from 'common/features/playback/utils/getAdQueryObject';
import type { GetOTTAdUrlOptions } from 'common/features/playback/utils/getAdQueryObject';
import { getAdUrlByQueryObject } from 'common/features/playback/utils/getAdUrlByQueryObject';

export const getWebAdUrl = ({
  useIPv4OnlyServer,
  needAuth,
  ...restOptions
}: GetOTTAdUrlOptions): string => {
  if (__SERVER__) return '';
  if (!restOptions.position || restOptions.position < 0) {
    restOptions.position = 0;
  }

  const params = getAdQueryObject(restOptions);

  return getAdUrlByQueryObject(params, useIPv4OnlyServer, needAuth);
};
