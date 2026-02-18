import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsBypassPreviewBufferCheck: ExperimentDescriptor<{
  bypass_buffer_check: boolean;
}> = {
  name: 'webott_major_platforms_bypass_preview_buffer_check',
  defaultParams: {
    bypass_buffer_check: false,
  },
};
