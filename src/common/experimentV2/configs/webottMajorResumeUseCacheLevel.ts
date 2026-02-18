import type { ExperimentDescriptor } from './types';

const webottMajorResumeUseCacheLevel: ExperimentDescriptor<{
  enable_resume_use_cache_level_v0: false | true;
}> = {
  name: 'webott_major_platforms_resume_use_cache_level_v0',
  layer: 'webott_major_platforms_cache_fragments',
  defaultParams: {
    enable_resume_use_cache_level_v0: false,
  },
};

export default webottMajorResumeUseCacheLevel;
