import type { Store } from 'redux';
import type { ValueOf } from 'ts-essentials';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webIosPlayback: 'webott_player_web_ios_playback_v6';
  }
}

TubiExperiments.webIosPlayback = 'webott_player_web_ios_playback_v6';

export const WEB_IOS_PLAYBACK = {
  namespace: 'webott_player_web_shared',
  parameter: 'web_ios_variant',
};

export const WEB_IOS_PLAYBACK_VARIANTS = {
  DISABLED: 0,
  ENABLED: 1,
  ENABLED_WITH_BANNER: 2,
} as const;
export type WebIosPlaybackVariants = ValueOf<typeof WEB_IOS_PLAYBACK_VARIANTS>;

export const getConfig = () => {
  return {
    ...WEB_IOS_PLAYBACK,
    id: TubiExperiments.webIosPlayback,
    experimentName: 'webott_player_web_ios_playback_v6',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: WEB_IOS_PLAYBACK_VARIANTS.DISABLED },
      { name: 'enable_web_ios_playback', value: WEB_IOS_PLAYBACK_VARIANTS.ENABLED },
      { name: 'enable_web_ios_playback_and_install_banner', value: WEB_IOS_PLAYBACK_VARIANTS.ENABLED_WITH_BANNER },
    ],
    enabledSelector() {
      return __WEBPLATFORM__ === 'WEB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
