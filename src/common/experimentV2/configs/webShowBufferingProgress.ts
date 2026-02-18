import type { ExperimentDescriptor } from './types';

export const webShowBufferingProgress: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_web_show_buffering_progress_v0',
  defaultParams: {
    enable: false,
  },
};
