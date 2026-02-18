import type { ExperimentDescriptor } from './types';

const webottFireTVAfttDetachHlsCacheFragments: ExperimentDescriptor<{
  enable_detach_hls_cache_fragments_v0: false | true;
}> = {
  name: 'webott_firetv_aftt_detach_hls_cache_fragments_v0',
  defaultParams: {
    enable_detach_hls_cache_fragments_v0: false,
  },
};

export default webottFireTVAfttDetachHlsCacheFragments;
