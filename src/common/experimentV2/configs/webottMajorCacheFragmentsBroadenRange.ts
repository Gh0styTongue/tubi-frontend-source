import type { ExperimentDescriptor } from './types';

const webottMajorCacheFragmentsBroadenRange: ExperimentDescriptor<{
  enable_cache_fragments_broaden_range_v0: false | true;
}> = {
  name: 'webott_major_platforms_cache_fragments_broaden_range_v0',
  layer: 'webott_major_platforms_cache_fragments',
  defaultParams: {
    enable_cache_fragments_broaden_range_v0: false,
  },
};

export default webottMajorCacheFragmentsBroadenRange;
