import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { toggleLoginModal } from 'common/actions/ui';
import { DIALOG } from 'common/constants/event-types';
import { loginCallback } from 'common/features/authentication/actions/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Reaction } from 'common/types/userReactions';
import { buildDialogEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { trackDislikeExplicitInteraction, trackLikeExplicitInteraction } from 'common/utils/userReactions';

export const messages = defineMessages({
  youNeedToSignIn: {
    description: 'Notification title text - You need to sign in!',
    defaultMessage: 'You need to sign in!',
  },
  pleaseSignInToSaveYourRatings: {
    description: 'Notification description text - Please sign in to save your ratings.',
    defaultMessage: 'Please sign in to save your ratings',
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

interface ShowRegistrationPromptToastParams {
  reaction: Reaction;
  loginCallback: VoidFunction;
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  pathname: string;
}

function showRegistrationPromptToast({
  reaction,
  loginCallback: signInLoginCallback,
  dispatch,
  intl,
  pathname,
}: ShowRegistrationPromptToastParams): void {
  const { formatMessage } = intl;
  dispatch(toggleLoginModal({
    isOpen: true,
    title: formatMessage(messages.youNeedToSignIn),
    description: formatMessage(messages.pleaseSignInToSaveYourRatings),
    onLogin: () => {
      dispatch(loginCallback(signInLoginCallback));
    },
  }));
  const dialogSubtype = `title_${reaction}`;
  trackEvent(DIALOG, buildDialogEvent(pathname, DialogType.SIGNIN_REQUIRED, dialogSubtype, DialogAction.SHOW));
}

interface ShowReactionPromptParams {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  contentId: string;
  onLoginCallback: () => void;
}

export const showLikeRegistrationPromptToast = ({
  dispatch,
  intl,
  contentId,
  onLoginCallback,
}: ShowReactionPromptParams): void => {
  const pathname = getCurrentPathname();
  function likeLoginCallback() {
    trackLikeExplicitInteraction(contentId, undefined, pathname);
    onLoginCallback();
  }
  showRegistrationPromptToast({
    pathname,
    reaction: 'like',
    loginCallback: likeLoginCallback,
    dispatch,
    intl,
  });
};

export const showDislikeRegistrationPromptToast = ({
  dispatch,
  intl,
  contentId,
  onLoginCallback,
}: ShowReactionPromptParams): void => {
  const pathname = getCurrentPathname();
  function dislikeLoginCallback() {
    trackDislikeExplicitInteraction(contentId, undefined, pathname);
    onLoginCallback();
  }
  showRegistrationPromptToast({
    pathname,
    reaction: 'dislike',
    loginCallback: dislikeLoginCallback,
    dispatch,
    intl,
  });
};
