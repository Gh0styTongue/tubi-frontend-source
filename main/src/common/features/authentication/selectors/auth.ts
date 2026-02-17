import { parseQueryString } from '@adrise/utils/lib/queryString';
import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

const authSelector = ({ auth }: StoreState) => auth;

export const userSelector = createSelector(authSelector, (auth) => auth.user);

export const isLoggedInSelector = createSelector(userSelector, (user) => !!user);

export const loginCallbackSelector = createSelector(authSelector, (auth) => auth.loginCallback);

export const onLoginCanceledSelecor = createSelector(authSelector, (auth) => auth.onLoginCanceled);

export const loginRedirectSelector = createSelector(
  (state: StoreState) => state.auth.loginRedirect,
  (_state: StoreState, props: { queryString: string }) =>
    parseQueryString(props.queryString).redirect as string | undefined,
  (loginRedirect, searchRedirect) => searchRedirect || loginRedirect || ''
);

export const userCredentialsSelector = createSelector(authSelector, (auth) => auth.userCredentials);

export const userIdSelector = createSelector(userSelector, (user) => user?.userId);
