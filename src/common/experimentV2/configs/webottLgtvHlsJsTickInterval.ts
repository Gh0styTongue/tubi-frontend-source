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
    main: 500,
    audio: 500,
  },
  [TICK_INTERVAL_MODE.VARIANT_TWO]: {
    main: 2000,
    audio: 2000,
  },
  [TICK_INTERVAL_MODE.VARIANT_THREE]: {
    main: 5000,
    audio: 5000,
  },
};

const webottLgtvHlsJsTickInterval: ExperimentDescriptor<{
  tick_interval_mode_v1: TICK_INTERVAL_MODE.CONTROL | TICK_INTERVAL_MODE.VARIANT_ONE | TICK_INTERVAL_MODE.VARIANT_TWO | TICK_INTERVAL_MODE.VARIANT_THREE;
}> = {
  name: 'webott_lgtv_hlsjs_tick_interval_v1',
  layer: 'webott_major_platforms_performance_optimization_shared',
  defaultParams: {
    tick_interval_mode_v1: TICK_INTERVAL_MODE.CONTROL,
  },
};

export default webottLgtvHlsJsTickInterval;
