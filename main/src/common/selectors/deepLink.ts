import { createSelector } from 'reselect';

import {
  BACK_FROM_DETAIL_TO_HOME,
  BACK_FROM_LIVE_PLAYBACK_TO_HOME,
  BACK_FROM_PLAYBACK_TO_DETAIL,
} from 'common/constants/constants';
import type { StoreState } from 'common/types/storeState';

export const isDeepLinkedSelector = createSelector(
  ({ ui: { deeplinkBackOverrides } }: StoreState) => deeplinkBackOverrides[BACK_FROM_PLAYBACK_TO_DETAIL],
  (state: StoreState) => typeof state.ottSystem?.tizenDeeplinkPage === 'string' && state.ottSystem.tizenDeeplinkPage.length > 0,
  (deeplinkBackOverride: boolean | undefined, isTizenDeeplink) => isTizenDeeplink || !!deeplinkBackOverride,
);

export const isLivePlaybackDeepLinkedSelector = createSelector(
  ({ ui: { deeplinkBackOverrides } }: StoreState) => deeplinkBackOverrides[BACK_FROM_LIVE_PLAYBACK_TO_HOME],
  (deeplinkBackOverride: boolean | undefined) => !!deeplinkBackOverride,
);

export const isPlaybackDeeplinkSelector = createSelector(
  isDeepLinkedSelector,
  isLivePlaybackDeepLinkedSelector,
  (isDeepLinked, isLivePlaybackDeepLinked) => isDeepLinked || isLivePlaybackDeepLinked,
);

export const isDetailDeepLinkedSelector = createSelector(
  ({ ui: { deeplinkBackOverrides } }: StoreState) => deeplinkBackOverrides[BACK_FROM_DETAIL_TO_HOME],
  (deeplinkBackOverride: boolean | undefined) => !!deeplinkBackOverride,
);
