import type { ExperimentDescriptor } from './types';

const WebOTTMajorPlatformsStartupEndBufferLevel: ExperimentDescriptor<{
  startup_end_buffer_level_v3: 0 | 5 | 10;
}> = {
  name: 'webott_major_platforms_startup_end_buffer_level_v3',
  defaultParams: {
    startup_end_buffer_level_v3: 0,
  },
};

export default WebOTTMajorPlatformsStartupEndBufferLevel;
