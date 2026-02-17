import type { GetOTTAdUrlOptions } from 'common/features/playback/utils/getAdQueryObject';
import { getAdQueryObject } from 'common/features/playback/utils/getAdQueryObject';

export const getWebAdQueryObjectForLiveNews = (params: GetOTTAdUrlOptions) => {
  const { position, ...rest } = params;
  // We don't have live news for GDPR yet, so we don't need to add GDPR query
  return getAdQueryObject({ ...rest, addGDPRQuery: false });
};
