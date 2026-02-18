import type { ExperimentDescriptor } from './types';

const ottPlayerFireTVUseHlsAds: ExperimentDescriptor<{
  use_hls_ads: boolean;
}> = {
  layer: 'webott_player_firetv_adplayer',
  name: 'webott_player_ott_firetv_hls_ads_v4',
  defaultParams: {
    use_hls_ads: false,
  },
  inYoubora: true,
};

export default ottPlayerFireTVUseHlsAds;
