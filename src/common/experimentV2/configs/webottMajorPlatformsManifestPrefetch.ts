import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsManifestPrefetch: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_major_platforms_manifest_prefetch',
  defaultParams: {
    enable: false,
  },
  inYoubora: true,
};
