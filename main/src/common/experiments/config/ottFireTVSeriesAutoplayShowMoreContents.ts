import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSeriesAutoplayShowMoreContents: 'webott_firetv_series_autoplay_show_more_contents_v1';
  }
}

TubiExperiments.ottFireTVSeriesAutoplayShowMoreContents = 'webott_firetv_series_autoplay_show_more_contents_v1';

export const FIRETV_SERIES_AUTOPLAY_SHOW_MORE_CONTENT = {
  namespace: 'webott_firetv_series_autoplay_show_more_contents',
  parameter: 'show_more_contents',
};

export const VARIANT_SERIES_AUTOPLAY_NUMBER = 10;
export const VARIANT_SERIES_AUTOPLAY_COUNTDOWN = 15;

export const enum SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE {
  CONTROL = 0,
  SHOW_MORE_CONTENTS = 1,
  SHOW_MORE_CONTENTS_WITH_COUNTDOWN_15S = 2
}

export type TreatmentValue = SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.CONTROL | SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.SHOW_MORE_CONTENTS | SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.SHOW_MORE_CONTENTS_WITH_COUNTDOWN_15S;

export type TreatmentName = 'control' | 'show_more_contents' | 'show_more_contents_with_countdown_15s';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SERIES_AUTOPLAY_SHOW_MORE_CONTENT,
    id: TubiExperiments.ottFireTVSeriesAutoplayShowMoreContents,
    experimentName: 'webott_firetv_series_autoplay_show_more_contents_v1',
    defaultValue: SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.CONTROL,
    inYoubora: true,
    treatments: [
      { name: 'control', value: SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.CONTROL },
      { name: 'show_more_contents', value: SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.SHOW_MORE_CONTENTS },
      { name: 'show_more_contents_with_countdown_15s', value: SERIES_AUTOPLAY_SHOW_MORE_CONTENTS_MODE.SHOW_MORE_CONTENTS_WITH_COUNTDOWN_15S },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
