import type { Location } from 'history';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { remove as removeFromHistory } from 'common/actions/history';
import { add as addToQueue, remove as removeFromQueue } from 'common/actions/queue';
import { addNotification } from 'common/actions/ui';
import { addReactionForSingleTitle } from 'common/actions/userReactions';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import type { majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import type { ContentType, QueueState } from 'common/types/queue';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Notification } from 'common/types/ui';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getLoginRedirect } from 'common/utils/urlConstruction';
import { showFeatureUnavailableToaster } from 'web/utils/featureUnavailable';
import { removeUrlParams } from 'web/utils/urlManipulation';

const messages = defineMessages({
  addToListTitle: {
    description: 'Notification title text - Add to My List',
    defaultMessage: '{title} has been added to your list',
  },
  removeFromListTitle: {
    description: 'Notification title text - Remove from My List',
    defaultMessage: '{title} has been removed from your list',
  },
  likeTitle: {
    description: 'Notification title text - Like',
    defaultMessage: 'Thanks for your feedback!',
  },
  likeDescription: {
    description: 'Notification description text - Like',
    defaultMessage: 'We\'ll suggest more titles like this in future recommendations.',
  },
  dislikeTitle: {
    description: 'Notification title text - Dislike',
    defaultMessage: 'Thanks for your feedback!',
  },
  dislikeDescription: {
    description: 'Notification description text - Dislike',
    defaultMessage: 'We\'ll suggest fewer titles like this in future recommendations.',
  },
  removeFromContinueWatchingTitle: {
    description: 'Notification description text - Remove from Continue Watching',
    defaultMessage: '{title} has been removed from Continue Watching',
  },
  signInTitle: {
    description: 'Notification title text - Sign in',
    defaultMessage: 'You need to sign in!',
  },
  signInDescriptionAddList: {
    description: 'Notification description text - Sign in to add to My List',
    defaultMessage: 'Please sign in to add {title} to your list.',
  },
  signInDescriptionRemoveList: {
    description: 'Notification description text - Sign in to remove from My List',
    defaultMessage: 'Please sign in to remove {title} from your list.',
  },
  signInDescriptionFeedback: {
    description: 'Notification description text - Sign in to give feedback',
    defaultMessage: 'Please sign in to give your feedback.',
  },
  buttonSignIn: {
    description: 'Notification button text - Sign In',
    defaultMessage: 'Sign In',
  },
  buttonClose: {
    description: 'Notification button text - Close',
    defaultMessage: 'Close',
  },
});

export const PROMPT_ID = 'deeplink-action-prompt';

export const DEEPLINK_ACTIONS = {
  ADD_TO_MY_LIST: 'add-to-my-list',
  REMOVE_FROM_MY_LIST: 'remove-from-my-list',
  LIKE: 'like',
  DISLIKE: 'dislike',
  REMOVE_FROM_CONTINUE_WATCHING: 'remove-from-continue-watching',
};

interface SharedProps {
  dispatch: TubiThunkDispatch;
  contentId: string;
  intl: IntlShape;
  isLoggedIn?: boolean;
  title: string;
  location: Location;
  currentDate: Date;
  isMajorEventFailsafe: boolean;
  majorEventFailsafeMessages: ReturnType<typeof majorEventFailsafeMessageSelector>;
}

interface AddToMyListProps extends SharedProps {
  contentType?: ContentType;
}

interface RemoveFromMyListProps extends SharedProps {
  queue: QueueState;
}

interface AllProps extends SharedProps, AddToMyListProps, RemoveFromMyListProps {
  action: string;
}

export const getDeepLinkAction = (location: Location | undefined) => {
  const action = location?.query?.action || '';
  return Object.values(DEEPLINK_ACTIONS).includes(action as string) ? action : '';
};

export const getDeepLinkContentId = (location: Location) => {
  return location.query?.contentId || '';
};

export const isDeepLinkAction = (location: Location | undefined) => {
  return !!getDeepLinkAction(location);
};

const getSignInPromptDescription = (action: string | string[], intl: IntlShape, title: string) => {
  switch (action) {
    case DEEPLINK_ACTIONS.ADD_TO_MY_LIST:
      return intl.formatMessage(messages.signInDescriptionAddList, { title });
    case DEEPLINK_ACTIONS.REMOVE_FROM_MY_LIST:
      return intl.formatMessage(messages.signInDescriptionRemoveList, { title });
    case DEEPLINK_ACTIONS.LIKE:
    case DEEPLINK_ACTIONS.DISLIKE:
      return intl.formatMessage(messages.signInDescriptionFeedback);
    /* istanbul ignore next */
    default:
      return '';
  }
};

export const getSignInRedirectAction =
  ({ loginRedirect }: { loginRedirect: string }) =>
    () => {
      tubiHistory.push(`${WEB_ROUTES.signIn}${loginRedirect}`);
    };

const notificationOptions = {
  description: '',
  autoDismiss: false,
  wrapTitle: true,
};

export const showSignInPrompt = ({ action, dispatch, intl, title }: AllProps) => {
  const loginRedirect = getLoginRedirect(getCurrentPathname(), { action });
  const notification: Notification = {
    ...notificationOptions,
    status: 'info',
    title: intl.formatMessage(messages.signInTitle),
    description: getSignInPromptDescription(action, intl, title),
    buttons: [
      {
        title: intl.formatMessage(messages.buttonSignIn),
        action: getSignInRedirectAction({ loginRedirect }),
        primary: true,
      },
      {
        title: intl.formatMessage(messages.buttonClose),
      },
    ],
  };
  dispatch(addNotification(notification, PROMPT_ID));
};

export const removeFromMyList = ({ dispatch, contentId, intl, queue, title, location }: RemoveFromMyListProps) => {
  const { contentIdMap } = queue;
  const itemId = contentIdMap[contentId]?.id;
  dispatch(removeFromQueue(itemId, contentId, location));
  dispatch(
    addNotification(
      {
        ...notificationOptions,
        status: 'remove',
        title: intl.formatMessage(messages.removeFromListTitle, { title }),
      },
      PROMPT_ID
    )
  );
};

const addToMyList = ({ contentType, dispatch, contentId, intl, title }: AddToMyListProps) => {
  dispatch(addToQueue(contentId, contentType as ContentType));
  dispatch(
    addNotification(
      {
        ...notificationOptions,
        status: 'add',
        title: intl.formatMessage(messages.addToListTitle, { title }),
      },
      PROMPT_ID
    )
  );
};

const like = ({ location, dispatch, contentId, intl }: SharedProps) => {
  dispatch(addReactionForSingleTitle(location, contentId, 'like'));
  dispatch(
    addNotification(
      {
        ...notificationOptions,
        status: 'like',
        title: intl.formatMessage(messages.likeTitle),
        description: intl.formatMessage(messages.likeDescription),
      },
      PROMPT_ID
    )
  );
};

const dislike = ({ location, dispatch, contentId, intl }: SharedProps) => {
  dispatch(addReactionForSingleTitle(location, contentId, 'dislike'));
  dispatch(
    addNotification(
      {
        ...notificationOptions,
        status: 'dislike',
        title: intl.formatMessage(messages.dislikeTitle),
        description: intl.formatMessage(messages.dislikeDescription),
      },
      PROMPT_ID
    )
  );
};

const removeFromContinueWatching = ({ contentId, dispatch, intl, title, location }: SharedProps) => {
  dispatch(removeFromHistory(location, contentId));
  dispatch(
    addNotification(
      {
        ...notificationOptions,
        status: 'delete',
        title: intl.formatMessage(messages.removeFromContinueWatchingTitle, { title }),
      },
      PROMPT_ID
    )
  );
};

export const handleDeepLinkAction = (props: AllProps) => {
  const { action, isLoggedIn, isMajorEventFailsafe, dispatch, intl, currentDate, majorEventFailsafeMessages } = props;
  if (isMajorEventFailsafe) {
    let feature;
    switch (action) {
      case DEEPLINK_ACTIONS.ADD_TO_MY_LIST:
      case DEEPLINK_ACTIONS.REMOVE_FROM_MY_LIST:
        feature = 'myList' as const;
        break;
      case DEEPLINK_ACTIONS.LIKE:
      case DEEPLINK_ACTIONS.DISLIKE:
        feature = 'rating' as const;
        break;
      case DEEPLINK_ACTIONS.REMOVE_FROM_CONTINUE_WATCHING:
        feature = 'continueWatching' as const;
        break;
      default:
        break;
    }
    showFeatureUnavailableToaster({
      dispatch,
      intl,
      feature,
      currentDate,
      majorEventFailsafeMessages,
    });
    return;
  }
  if (!isLoggedIn) {
    return showSignInPrompt(props);
  }

  switch (action) {
    case DEEPLINK_ACTIONS.ADD_TO_MY_LIST:
      addToMyList(props);
      break;
    case DEEPLINK_ACTIONS.REMOVE_FROM_MY_LIST:
      removeFromMyList(props);
      break;
    case DEEPLINK_ACTIONS.LIKE:
      like(props);
      break;
    case DEEPLINK_ACTIONS.DISLIKE:
      dislike(props);
      break;
    case DEEPLINK_ACTIONS.REMOVE_FROM_CONTINUE_WATCHING:
      removeFromContinueWatching(props);
      break;
    /* istanbul ignore next */
    default:
      break;
  }

  // remove action query parameter from URL
  removeUrlParams(['action', 'contentId']);
};
