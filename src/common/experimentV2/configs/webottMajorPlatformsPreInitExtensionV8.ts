import type { ExperimentDescriptor } from './types';

const WebOTTMajorPlatformsPreInitExtensionV8: ExperimentDescriptor<{
  enable_pre_init: boolean;
}> = {
  name: 'webott_major_platforms_pre_init_extension_v8',
  defaultParams: {
    enable_pre_init: false,
  },
};

export default WebOTTMajorPlatformsPreInitExtensionV8;

