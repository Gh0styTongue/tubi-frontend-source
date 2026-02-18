import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';

import { getReturningUserVisitCount, setReturningUserVisitCount } from 'client/utils/user';
import { toggleAddAccountTooltip } from 'common/actions/ui';
import { MAX_RETURNING_USER_VISIT_COUNT_FOR_TOOLTIP } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import { updateUserState } from 'common/features/authentication/actions/multipleAccounts';
import { syncAnonymousTokensAndSetTubiId } from 'common/features/authentication/actions/tubiId';
import { loadUserList } from 'common/features/authentication/actions/userList';
import { flattenedUserListSelector, isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import tubiHistory from 'common/history';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { TubiStore } from 'common/types/storeState';
import { DeeplinkType } from 'common/utils/deeplinkType';
import { clearAnonymousTokens } from 'common/utils/token';
import { getUserSessionFromLocalStorage } from 'ott/features/authentication/utils/userSession';

const redirectToAccountPicker = async (dispatch: TubiThunkDispatch, isLoggedIn: boolean) => {
  const { pathname, search } = tubiHistory.getCurrentLocation();
  let redirectPath = `${pathname}${search}`;

  // fallback to home for excluded routes
  if (pathname === OTT_ROUTES.accounts) {
    redirectPath = OTT_ROUTES.home;
  }

  // if logged-in, clear the current user and init anonymous token and tubi ID
  if (isLoggedIn) {
    dispatch(updateUserState(null));
    await dispatch(syncAnonymousTokensAndSetTubiId());
  }

  tubiHistory.replace(addQueryStringToUrl(OTT_ROUTES.accounts, { redirectPath }));
};

/**
 * Setup multiple accounts for OTT and redirect to the Account Picker if necessary
 * TODO: Web will use similar but different logic since there is no Account Picker page
 */
export const setupMultipleAccounts = async (store: TubiStore): Promise<void> => {

  // TODO: Setup experiment for Phase 2 MVP
  if (FeatureSwitchManager.isDefault('MultipleAccountsPhase2')) {
    return;
  }

  const { dispatch, getState } = store;
  const {
    ottUI: { deeplinkType },
    ui: { isKidsModeEnabled },
  } = getState();

  // some platforms have distinct deeplink routes (FireTV, LGTV, Comcast family)
  // while others determine deeplinks from the presence of utm query params
  const { pathname } = tubiHistory.getCurrentLocation();
  const isDeeplinkPath = ([OTT_ROUTES.ottDeeplink, OTT_ROUTES.deeplink] as string[]).includes(pathname);
  const isDeeplink = isDeeplinkPath || deeplinkType !== DeeplinkType.None;

  // TODO: FireTV handles loadUserList manually with local storage, but Web/Comcast will need an API
  const loadUserListPromise = dispatch(loadUserList());

  // continue loading the app normally, user list is loaded asynchronously
  if (isDeeplink || isKidsModeEnabled) {
    return;
  }

  // wait for the user list to be loaded
  await loadUserListPromise;

  const state = getState();
  const userList = flattenedUserListSelector(state);

  // for guest users, continue loading the app normally
  if (userList.length === 0) {
    return;
  }

  // redirect to the Account Picker for devices with 2+ accounts
  // and for devices with 1+ account and no active user session (e.g. after logout)
  const isLoggedIn = isLoggedInSelector(state);
  const currentUserSession = await getUserSessionFromLocalStorage();
  if (userList.length >= 2 || (userList.length >= 1 && !currentUserSession)) {
    return redirectToAccountPicker(dispatch, isLoggedIn);
  }

  // for devices with 1 account, promote the Multiple Accounts feature in the UI based on the visit count
  // TODO: verify local storage for GDRP if we keep this feature after graduation
  let returningUserVisitCount = 0;
  const lastVisitCount = getReturningUserVisitCount();
  returningUserVisitCount = lastVisitCount + 1;
  if (returningUserVisitCount <= MAX_RETURNING_USER_VISIT_COUNT_FOR_TOOLTIP + 1) {
    setReturningUserVisitCount(returningUserVisitCount);
  }

  switch (returningUserVisitCount) {
    case 1:
      // 1st return visit, redirect to the Account Picker to introduce the feature
      return redirectToAccountPicker(dispatch, isLoggedIn);
    case 2:
    case 3:
      // 2nd and 3rd visits, show a tool tip to nudge the user to add another account
      store.dispatch(toggleAddAccountTooltip(true));
      break;
    default:
      // 4th and later visits, continue loading the app normally
      break;
  }
};

// Anonymous tokens are cleared only when the logged-in state changes from false to true.
// Therefore, the default value of lastIsLoggedIn is set to true here to prevent clearing
// anonymous tokens when the user is already logged in.
let lastIsLoggedIn = true;

export const removeAnonymousToken = (store: TubiStore) => {
  const isLoggedIn = isLoggedInSelector(store.getState());

  if (lastIsLoggedIn === isLoggedIn) {
    return;
  }

  lastIsLoggedIn = isLoggedIn;

  if (isLoggedIn) {
    clearAnonymousTokens();
  }
};
