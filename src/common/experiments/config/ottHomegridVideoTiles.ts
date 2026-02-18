import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottHomegridVideoTiles: 'webott_major_platforms_homegrid_video_tiles_1_3';
  }
}

TubiExperiments.ottHomegridVideoTiles = 'webott_major_platforms_homegrid_video_tiles_1_3';

export enum HOMEGRID_VIDEO_TILES_VALUE {
  // experiment 1.3 values:
  CONTROL = '',
  SWAP_FEATURED_AND_RECOMMENDED = 'recommended',
  ALL_442_DIMMED_PEEK = 'all_442_dimmed_peek',
  ALL_442 = 'all_442',

  // legacy values:
  ALL_360 = 'all_360',
  STAGING_PORTRAIT_360 = 'staging_portrait_360',
  STAGING_PORTRAIT_442 = 'staging_portrait',
  CINEMASCOPE = 'tiles',
  CINEMASCOPE_WITH_DESCRIPTION = 'tiles_with_description',
  RECOMMENDED_STAGING_PORTRAIT = 'recommended_staging_portrait',
}

export const HOMEGRID_VIDEO_TILES = {
  namespace: 'webott_major_platforms_homegrid_video_tiles',
  parameter: 'type',
};

export const getConfig = () => {
  return {
    ...HOMEGRID_VIDEO_TILES,
    id: TubiExperiments.ottHomegridVideoTiles,
    experimentName: 'webott_major_platforms_homegrid_video_tiles_1_3',
    defaultValue: HOMEGRID_VIDEO_TILES_VALUE.CONTROL,
    treatments: [
      // experiment 1.3 treatments:
      /* A */ { name: 'control', value: HOMEGRID_VIDEO_TILES_VALUE.CONTROL } as const,
      /* B */ { name: 'recommended_legacy_static_tiles', value: HOMEGRID_VIDEO_TILES_VALUE.SWAP_FEATURED_AND_RECOMMENDED },
      /* C */ { name: 'video_tiles_dimmed_peek', value: HOMEGRID_VIDEO_TILES_VALUE.ALL_442_DIMMED_PEEK },
      /* D */ { name: 'video_tiles_non_dimmed_peek', value: HOMEGRID_VIDEO_TILES_VALUE.ALL_442 },

      // legacy treatments:
      /* E */ { name: 'all_360', value: HOMEGRID_VIDEO_TILES_VALUE.ALL_360 },
      {
        name: 'compact',
        value: HOMEGRID_VIDEO_TILES_VALUE.STAGING_PORTRAIT_360,
      },
      {
        name: 'moderate',
        value: HOMEGRID_VIDEO_TILES_VALUE.STAGING_PORTRAIT_442,
      },
      {
        name: 'homegrid_video_tiles_2w_2391',
        value: HOMEGRID_VIDEO_TILES_VALUE.CINEMASCOPE,
      } as const,
      {
        name: 'homegrid_video_tiles_2w_2391_description',
        value: HOMEGRID_VIDEO_TILES_VALUE.CINEMASCOPE_WITH_DESCRIPTION,
      } as const,
      {
        name: 'recommended',
        value: HOMEGRID_VIDEO_TILES_VALUE.SWAP_FEATURED_AND_RECOMMENDED,
      } as const,
      {
        name: 'staging_portrait',
        value: HOMEGRID_VIDEO_TILES_VALUE.STAGING_PORTRAIT_442,
      } as const,
      {
        name: 'recommended_staging_portrait',
        value: HOMEGRID_VIDEO_TILES_VALUE.RECOMMENDED_STAGING_PORTRAIT,
      } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
