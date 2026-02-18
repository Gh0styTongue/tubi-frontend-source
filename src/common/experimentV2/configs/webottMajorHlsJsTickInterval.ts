import type { ExperimentDescriptor } from './types';

export enum TICK_INTERVAL_MODE {
  CONTROL = 0,
  VARIANT_ONE = 1,
  VARIANT_TWO = 2,
  VARIANT_THREE = 3,
}

export const TICK_INTERVAL_VALUE: Record<TICK_INTERVAL_MODE, { main?: number; audio?: number; subtitle?: number }> = {
  [TICK_INTERVAL_MODE.CONTROL]: {}, // hls.js default value { main: 100, audio: 100 }
  [TICK_INTERVAL_MODE.VARIANT_ONE]: {
    main: 50,
    audio: 50,
  },
  [TICK_INTERVAL_MODE.VARIANT_TWO]: {
    main: 200,
    audio: 200,
  },
  [TICK_INTERVAL_MODE.VARIANT_THREE]: {
    main: 500,
    audio: 500,
  },
};

const webottMajorHlsJsTickInterval: ExperimentDescriptor<{
  tick_interval_mode_v0: TICK_INTERVAL_MODE.CONTROL | TICK_INTERVAL_MODE.VARIANT_ONE | TICK_INTERVAL_MODE.VARIANT_TWO | TICK_INTERVAL_MODE.VARIANT_THREE;
}> = {
  name: 'webott_major_platforms_hlsjs_tick_interval_v0',
  defaultParams: {
    tick_interval_mode_v0: TICK_INTERVAL_MODE.CONTROL,
  },
};

export default webottMajorHlsJsTickInterval;
