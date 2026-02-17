import type { Platform } from '@tubitv/analytics/lib/baseTypes';

import type { PlatformUppercase as PlatformType } from 'common/constants/platforms';

/**
 * Get analytics platform from tubi platform.
 */

export const getAnalyticsPlatform = (platform: PlatformType): Platform => {
  if (platform === 'FIRETV_HYB') return 'AMAZON';
  if (platform === 'TIZEN') return 'SAMSUNG';
  return platform as Platform;
};
