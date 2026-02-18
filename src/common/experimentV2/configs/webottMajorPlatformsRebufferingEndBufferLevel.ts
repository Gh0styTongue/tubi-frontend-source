import type { ExperimentDescriptor } from './types';

const WebOTTMajorPlatformsRebufferingEndBufferLevel: ExperimentDescriptor<{
  rebuffering_end_buffer_level_v4: 0 | 10;
}> = {
  name: 'webott_major_platforms_rebuffering_end_buffer_level_v4',
  defaultParams: {
    rebuffering_end_buffer_level_v4: 0,
  },
};

export default WebOTTMajorPlatformsRebufferingEndBufferLevel;
