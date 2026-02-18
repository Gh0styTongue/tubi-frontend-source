import type { ExperimentDescriptor } from './types';

export const webottMajorPlatformsLiveStartplayLoadeddata: ExperimentDescriptor<{
  startplay: 'on_ready' | 'on_loadeddata' | 'ready_loadeddata';
}> = {
  name: 'webott_major_platforms_live_startplay_loadeddata',
  defaultParams: {
    startplay: 'on_ready',
  },
};

