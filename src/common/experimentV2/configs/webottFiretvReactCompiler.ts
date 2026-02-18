import type { ExperimentDescriptor } from './types';

export const webottFiretvReactCompiler: ExperimentDescriptor<{
  enable_compiler: boolean;
}> = {
  name: 'webott_firetv_react_compiler',
  defaultParams: {
    enable_compiler: false,
  },
};
