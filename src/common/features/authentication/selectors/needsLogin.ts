import { createSelector } from 'reselect';

import { ENABLE_MATURE_CONTENT_GATE } from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { byIdSelector as epgByIdSelector } from 'common/selectors/epg';
import { byIdSelector } from 'common/selectors/video';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { LoginReason } from 'common/types/video';

export const contentSelector = createSelector(
  byIdSelector,
  epgByIdSelector,
  (_: StoreState, input: Video | ChannelEPGInfo | string | number | null | undefined) => input,
  (byId, epgById, input) => {
    const content = typeof input === 'string' || typeof input === 'number' ? byId[input] || epgById[input] : input;
    return content;
  }
);

export const needsLoginSelector = createSelector(isLoggedInSelector, contentSelector, (isLoggedIn, content) => {
  /* istanbul ignore next */
  const needsLogin = content?.needs_login;
  return ENABLE_MATURE_CONTENT_GATE && !isLoggedIn && !!needsLogin;
});

export const loginReasonSelector = createSelector(needsLoginSelector, contentSelector, (needsLogin, content) => {
  return needsLogin ? content?.login_reason : null;
});

export const isMatureContentGatedSelector = createSelector(loginReasonSelector, (loginReason) => {
  return loginReason === LoginReason.MATURE_CONTENT_GATING;
});
