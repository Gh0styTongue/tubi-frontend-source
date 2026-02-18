import { getExperiment } from 'common/experimentV2';
import webottMajorReuseAutoplayAndRelatedVideoResource from 'common/experimentV2/configs/webottMajorReuseAutoplayAndRelatedVideoResource';

export const isReuseAutoplayAndRelatedVideoResource = () => {
  const value = getExperiment(webottMajorReuseAutoplayAndRelatedVideoResource)?.get('reuse_autoplay_related_video_resource_v0');
  return !!value;
};
