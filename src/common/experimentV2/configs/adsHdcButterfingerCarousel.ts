import type { ExperimentDescriptor } from './types';

export enum HDC_AD_VARIANT {
  control = 'control',
  carousel = 'carousel',
  spotlight = 'spotlight',
}

export const adsHdcButterfingerCarousel: ExperimentDescriptor<{
  enabled_arm: HDC_AD_VARIANT;
}> = {
  name: 'ads_hdc_butterfinger_carousel',
  layer: 'ads_webott_hdc_homepage_layer',
  defaultParams: {
    enabled_arm: HDC_AD_VARIANT.control,
  },
};
