import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHomegridVideoTiles: 'webott_firetv_homegrid_video_tiles_2w_2391_v2';
  }
}

TubiExperiments.ottFireTVHomegridVideoTiles = 'webott_firetv_homegrid_video_tiles_2w_2391_v2';

export enum FIRETV_HOMEGRID_VIDEO_TILES_VALUE {
  CONTROL = '',
  CINEMASCOPE = 'tiles',
  CINEMASCOPE_WITH_DESCRIPTION = 'tiles_with_description',
  SWAP_FEATURED_AND_RECOMMENDED = 'recommended',
  STAGING_PORTRAIT = 'staging_portrait',
  RECOMMENDED_STAGING_PORTRAIT = 'recommended_staging_portrait',
}

export const FIRETV_HOMEGRID_VIDEO_TILES = {
  namespace: 'webott_firetv_homegrid_video_tiles_2w_2391',
  parameter: 'type',
};

export const getConfig = () => {
  return {
    ...FIRETV_HOMEGRID_VIDEO_TILES,
    id: TubiExperiments.ottFireTVHomegridVideoTiles,
    experimentName: 'webott_firetv_homegrid_video_tiles_2w_2391_v2',
    defaultValue: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.CONTROL } as const,
      {
        name: 'homegrid_video_tiles_2w_2391',
        value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.CINEMASCOPE,
      } as const,
      {
        name: 'homegrid_video_tiles_2w_2391_description',
        value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.CINEMASCOPE_WITH_DESCRIPTION,
      } as const,
      {
        name: 'recommended',
        value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.SWAP_FEATURED_AND_RECOMMENDED,
      } as const,
      {
        name: 'staging_portrait',
        value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.STAGING_PORTRAIT,
      } as const,
      {
        name: 'recommended_staging_portrait',
        value: FIRETV_HOMEGRID_VIDEO_TILES_VALUE.RECOMMENDED_STAGING_PORTRAIT,
      } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
