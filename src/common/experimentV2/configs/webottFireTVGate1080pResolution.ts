import type { ValueOf } from 'ts-essentials';

import type { ExperimentDescriptor } from './types';

export enum FIRETV_GATE_1080P_VALUE {
  CONTROL = 0,
  UI_WITHOUT_REGISTRATION = 1,
  UI_WITH_REGISTRATION = 2,
}

export const MAX_LEVEL_RESOLUTION = 1000;

export const webottFireTVGate1080pResolution: ExperimentDescriptor<{
  gate_1080p_resolution: ValueOf<typeof FIRETV_GATE_1080P_VALUE>;
}> = {
  name: 'webott_firetv_gate_1080p_res',
  defaultParams: {
    gate_1080p_resolution: 0,
  },
};
