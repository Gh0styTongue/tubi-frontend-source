import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { Location } from 'history';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { attachRedirectCookie } from 'client/utils/auth';
import { addNotification, toggleLoginModal } from 'common/actions/ui';
import { addReactionForSingleTitle } from 'common/actions/userReactions';
import { REMOVE_NOTIFICATION } from 'common/constants/action-types';
import { DIALOG } from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import WebSimplifyRegistrationOnLikeButton from 'common/experiments/config/webSimplifyRegistrationOnLikeButton';
import { loginRedirect, loginCallback } from 'common/features/authentication/actions/auth';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Reaction } from 'common/types/userReactions';
import { actionWrapper } from 'common/utils/action';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { trackDislikeExplicitInteraction, trackLikeExplicitInteraction } from 'common/utils/userReactions';
import { getIntl } from 'i18n/intl';

export const messages = defineMessages({
  youNeedToSignIn: {
    description: 'Notification title text - You need to sign in!',
    defaultMessage: 'You need to sign in!',
  },
  pleaseSignInToSaveYourRatings: {
    description: 'Notification description text - Please sign in to save your ratings.',
    defaultMessage: 'Please sign in to save your ratings.',
  },
  signIn: {
    description: 'Notification button text - Sign In',
    defaultMessage: 'Sign In',
  },
  close: {
    description: 'Notification button text - Close',
    defaultMessage: 'Close',
  },
});

function makeNotificationId(contentId: string, reaction: Reaction): string {
  return `reaction-${reaction}-${contentId}`;
}

const inverseReactionMap: Record<Reaction, Reaction> = {
  like: 'dislike',
  dislike: 'like',
};

interface ShowRegistrationPromptToastParams {
  contentId: string;
  reaction: Reaction;
  loginCallback: VoidFunction;
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  pathname: string;
}

function showRegistrationPromptToast({
  contentId,
  reaction,
  loginCallback: signInLoginCallback,
  dispatch,
  intl,
  pathname,
}: ShowRegistrationPromptToastParams): void {
  const { formatMessage } = intl;
  const webSimplifyRegistrationOnLikeButton = WebSimplifyRegistrationOnLikeButton();
  webSimplifyRegistrationOnLikeButton.logExposure();
  if (webSimplifyRegistrationOnLikeButton.getValue()) {
    // TODO: @weikangzhang2022 add dialog events when graduating the experiment
    dispatch(toggleLoginModal({
      isOpen: true,
      title: formatMessage(messages.youNeedToSignIn),
      description: formatMessage(messages.pleaseSignInToSaveYourRatings),
      onLogin: () => {
        const pathname = getCurrentPathname();
        attachRedirectCookie(pathname);
        dispatch(loginRedirect(pathname));
        dispatch(loginCallback(signInLoginCallback));
      },
    }));
    return;
  }
  const dialogSubtype = `title_${reaction}`;
  trackEvent(DIALOG, buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.SHOW));
  dispatch(
    actionWrapper(REMOVE_NOTIFICATION, {
      id: makeNotificationId(contentId, inverseReactionMap[reaction]),
    })
  );

  const action = () => {
    dispatch(loginCallback(signInLoginCallback));

    const url = addQueryStringToUrl(WEB_ROUTES.signIn, { redirect: window.location.pathname + window.location.search });
    tubiHistory.push(url);
  };

  dispatch(
    addNotification(
      {
        title: formatMessage(messages.youNeedToSignIn),
        description: formatMessage(messages.pleaseSignInToSaveYourRatings),
        status: 'info',
        autoDismiss: false,
        buttons: [
          {
            title: formatMessage(messages.signIn),
            primary: true,
            action: () => {
              trackEvent(
                DIALOG,
                buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.ACCEPT_DELIBERATE)
              );
              action();
            },
          },
          {
            title: formatMessage(messages.close),
            action: () => {
              trackEvent(
                DIALOG,
                buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.DISMISS_DELIBERATE)
              );
            },
          },
        ],
      },
      makeNotificationId(contentId, reaction)
    )
  );
}

export const showLikeRegistrationPromptToast =
  (location: Location, contentId: string) => (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const pathname = getCurrentPathname();
    function likeLoginCallback() {
      trackLikeExplicitInteraction(contentId, undefined, pathname);
      dispatch(addReactionForSingleTitle(location, contentId, 'like'));
    }
    showRegistrationPromptToast({
      pathname,
      contentId,
      reaction: 'like',
      loginCallback: likeLoginCallback,
      dispatch,
      intl: getIntl(getState().ui.userLanguageLocale),
    });
  };

export const showDislikeRegistrationPromptToast =
  (location: Location, contentId: string) => (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const pathname = getCurrentPathname();
    function dislikeLoginCallback() {
      trackDislikeExplicitInteraction(contentId, undefined, pathname);
      dispatch(addReactionForSingleTitle(location, contentId, 'dislike'));
    }
    showRegistrationPromptToast({
      pathname,
      contentId,
      reaction: 'dislike',
      loginCallback: dislikeLoginCallback,
      dispatch,
      intl: getIntl(getState().ui.userLanguageLocale),
    });
  };
