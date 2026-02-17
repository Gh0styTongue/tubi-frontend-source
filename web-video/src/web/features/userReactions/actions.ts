import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { Location } from 'history';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { addNotification } from 'common/actions/ui';
import { addReactionForSingleTitle } from 'common/actions/userReactions';
import { REMOVE_NOTIFICATION } from 'common/constants/action-types';
import { DIALOG } from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { loginCallback } from 'common/features/authentication/actions/auth';
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

const messages = defineMessages({
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

function getInverseReaction(reaction: Reaction): Reaction {
  switch (reaction) {
    case 'like':
      return 'dislike';
    case 'dislike':
      return 'like';
    default:
      throw new Error(`Unexpected reaction value ${reaction}`);
  }
}

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
  const dialogSubtype = `title_${reaction}`;
  trackEvent(DIALOG, buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.SHOW));
  dispatch(
    actionWrapper(REMOVE_NOTIFICATION, {
      id: makeNotificationId(contentId, getInverseReaction(reaction)),
    })
  );
  dispatch(
    addNotification(
      {
        title: intl.formatMessage(messages.youNeedToSignIn),
        description: intl.formatMessage(messages.pleaseSignInToSaveYourRatings),
        status: 'info',
        autoDismiss: false,
        buttons: [
          {
            title: intl.formatMessage(messages.signIn),
            primary: true,
            action: () => {
              trackEvent(
                DIALOG,
                buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.ACCEPT_DELIBERATE)
              );
              dispatch(loginCallback(signInLoginCallback));
              tubiHistory.push(`${WEB_ROUTES.signIn}?redirect=${encodeURIComponent(window.location.pathname)}`);
            },
          },
          {
            title: intl.formatMessage(messages.close),
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
