import type { ExperimentDescriptor } from './types';

export const enum SEARCH_CONTAINERIZATION_VARIANT {
  CONTROL = 'control',
  ENABLED_WITH_PARITY_BASELINE = 'enabled_with_parity_baseline',
  ENABLED_WITH_PARITY_BESTMATCH = 'enabled_with_parity_bestmatch',
  ENABLED_WITH_API_CONCATENATION = 'enabled_with_api_concatenation',
}

type configCtx = {
  variant: SEARCH_CONTAINERIZATION_VARIANT;
  treatmentForAPI?: string;
}

export const webottMajorPlatformsSearchContainerizationVS2: ExperimentDescriptor<{
  config: configCtx;
}> = {
  name: 'webott_major_platforms_search_containerization_simple_v2',
  defaultParams: {
    config: { variant: SEARCH_CONTAINERIZATION_VARIANT.CONTROL },
  },
};
