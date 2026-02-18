import type { ExperimentDescriptor } from './types';

const ottPlayerSamsungUseHlsAds: ExperimentDescriptor<{
  use_hls_ads_preloading: boolean;
}> = {
  name: 'webott_player_ott_samsung_hls_ads_v8',
  defaultParams: {
    use_hls_ads_preloading: false,
  },
  inYoubora: true,
};

export default ottPlayerSamsungUseHlsAds;
