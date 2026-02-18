import { now, ONE_DAY } from '@adrise/utils/lib/time';

import { getLocalData } from 'client/utils/localDataStorage';
import logger from 'common/helpers/logging';

const AD_URL_BLACKLIST_MAX_AGE = ONE_DAY * 3;
export const AD_URL_BLACKLIST_KEY = 'adUrlBlacklist';

export const getLocalAdUrlBlacklist = (): { ts: number; adUrl: string; error: string }[] => {
  let adUrlBlacklist: { ts: number; adUrl: string; error: string }[] = [];
  try {
    const data = JSON.parse(getLocalData(AD_URL_BLACKLIST_KEY) || '[]');
    if (Array.isArray(data)) {
      adUrlBlacklist = data.filter(item => item.adUrl && item.ts && now() - item.ts < AD_URL_BLACKLIST_MAX_AGE);
    }
  } catch (error) {
    logger.error(error, 'Failed to get local ad url blacklist');
    adUrlBlacklist = [];
  }
  return adUrlBlacklist;
};
