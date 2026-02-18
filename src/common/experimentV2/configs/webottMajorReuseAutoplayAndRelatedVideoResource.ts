import type { ExperimentDescriptor } from './types';

const webottMajorReuseAutoplayAndRelatedVideoResource: ExperimentDescriptor<{
  reuse_autoplay_related_video_resource_v0: false | true;
}> = {
  name: 'webott_reuse_autoplay_related_video_resource_v0',
  defaultParams: {
    reuse_autoplay_related_video_resource_v0: false,
  },
};

export default webottMajorReuseAutoplayAndRelatedVideoResource;
