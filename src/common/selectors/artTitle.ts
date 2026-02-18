import { createSelector } from 'reselect';

import { ottFireTVTitleTreatmentSelector } from 'common/selectors/experiments/ottFireTVTitleTreatment';

export const shouldShowArtTitleSelector = createSelector(
  ottFireTVTitleTreatmentSelector,
  (ottFireTVTitleTreatment) => Boolean(
    __WEBPLATFORM__ ||
    ottFireTVTitleTreatment
  )
);

export const shouldFetchArtTitleSelector = createSelector(
  shouldShowArtTitleSelector,
  (shouldShow) => Boolean(
    // because webott_firetv_homegrid_video_tiles_2w_2391 runs on the homescreen
    // and the fetch happens before we've determined which experiments are
    // enabled, we need to always fetch the art title for firetv. If we graduate
    // this experiment to other platforms, we'll just make it always fetch them.
    shouldShow || __OTTPLATFORM__ === 'FIRETV_HYB'
  )
);
