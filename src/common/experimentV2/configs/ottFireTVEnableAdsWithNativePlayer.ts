import type { ExperimentDescriptor } from './types';

export const MIN_FIRETV_APP_VERSION = '9.49.1000';

/**
 * ads_mode values:
 * 0 - disabled (default)
 * 1 - enabled (same as previous v4 experiment)
 * 2 - enabled with preload feature for midroll
 */
const ottFireTVEnableAdsWithNativePlayer : ExperimentDescriptor<{
  ads_mode: 0|1|2;
}> = {
  layer: 'webott_player_firetv_adplayer',
  name: 'webott_firetv_enable_ads_with_native_player_v5',
  defaultParams: {
    ads_mode: 0,
  },
  inYoubora: true,
};

export default ottFireTVEnableAdsWithNativePlayer;
