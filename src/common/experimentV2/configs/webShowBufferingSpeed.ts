import type { ExperimentDescriptor } from './types';

export const webShowBufferingSpeed: ExperimentDescriptor<{
  enable: boolean;
}> = {
  name: 'webott_web_show_buffering_speed_v0',
  defaultParams: {
    enable: false,
  },
};
