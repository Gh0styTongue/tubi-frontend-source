import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsAutoplayMemoryCleanupFixV1: ExperimentDescriptor<{
  enable_memory_cleanup_fix: boolean;
}> = {
  name: 'webott_major_platforms_autoplay_memory_cleanup_fix_v1',
  defaultParams: {
    enable_memory_cleanup_fix: false,
  },
};
