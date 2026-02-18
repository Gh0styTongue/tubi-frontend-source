import type { ExperimentDescriptor } from './types';

const webDeferDrmFallbackDuringPreroll: ExperimentDescriptor<{
  defer_drm_fallback_during_preroll: boolean;
}> = {
  name: 'web_defer_drm_fallback_during_preroll_v1',
  defaultParams: {
    defer_drm_fallback_during_preroll: false,
  },
  inYoubora: true,
};

export default webDeferDrmFallbackDuringPreroll;
