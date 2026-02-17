import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import debounce from 'lodash/debounce';
import React, { Component, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { RouteComponentProps } from 'react-router';

import { saveUserPreferences } from 'client/utils/localDataStorage';
import { loadContainer, setContainerContext } from 'common/actions/container';
import { loadReminder } from 'common/actions/reminder';
import { addReactionForMultiTitles } from 'common/actions/userReactions';
import {
  tubiLogoURL,
  CONTAINER_TYPES,
  PERSONAL_COMING_SOON_CONTAINER_ID,
  FREEZED_EMPTY_ARRAY,
  ONBOARDING_PREFERENCES_CONTAINER_ID,
} from 'common/constants/constants';
import { SUBMITTED_PERSONALIZATION } from 'common/constants/cookies';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { containerSelector } from 'common/selectors/container';
import { contentModeForMenuListSelector } from 'common/selectors/contentMode';
import { shouldShowPersonalizationPromptSelector } from 'common/selectors/experiments/webPersonalizationPrompt';
import { videosByIdsSelector } from 'common/selectors/video';
import trackingManager from 'common/services/TrackingManager';
import type { FetchDataParams, ContainerState } from 'common/types/container';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { TubiContainerFC } from 'common/types/tubiFC';
import type { Video } from 'common/types/video';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getLogLevel } from 'common/utils/log';
import { trackEvent } from 'common/utils/track';
import { getContainerUrl } from 'common/utils/urlConstruction';
import { makeFullUrl } from 'common/utils/urlManipulation';
import { matchesRoute } from 'common/utils/urlPredicates';
import { trackLikeExplicitInteraction } from 'common/utils/userReactions';
import FloatingCastButton from 'web/components/FloatingCastButton/FloatingCastButton';
import Footer from 'web/components/Footer/Footer';
import WebChannel from 'web/components/WebChannel/WebChannel';
import WebContainer from 'web/components/WebContainer/WebContainer';
import MovieItemListSchema from 'web/features/seo/components/MovieItemListSchema/MovieItemListSchema';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';

const messages = defineMessages({
  metaDescription: {
    description: 'Description for shared content',
    defaultMessage:
      'Watch free {titleLowerCase} movies and TV shows online in HD on any device. Tubi offers streaming {titleLowerCase} movies and tv you will love.',
  },
  metaTitle: {
    description: 'Title for shared content',
    defaultMessage: 'Watch Free {title} Movies and TV Shows Online | Tubi',
  },
  onboardingReferenceContainerTitle: {
    description: 'Title for onboarding reference container',
    defaultMessage: 'Which of these do you like?',
  },
  onboardingReferenceContainerDescription: {
    description: 'Description for onboarding reference container',
    defaultMessage: 'Pick at least 3 titles that you like and we will recommend movies and TV shows we think you’ll love.',
  },
  likeContinueButtonText: {
    description: 'Text for the button after select liked tiles',
    defaultMessage: 'Continue',
  },
});

export type PropsFromRouter = RouteComponentProps<{id: string}, unknown, unknown>;

type PropsFromRedux = {
  dispatch: TubiThunkDispatch;
  id: string;
  slug: string;
  isLoggedIn?: boolean;
  items: ContainerState['containerChildrenIdMap'][string];
  type: string;
  title: string;
  thumbnail?: string | null;
  description: string;
  allLoaded: boolean;
  backgrounds?: Video['backgrounds'];
  logo?: string;
  externalUrl?: string;
  isKidsModeEnabled: boolean;
  isMobile: boolean;
  videos: Video[];
  shouldShowSelectableOnboardingTile: boolean;
};

type PropsFromIntl = {
  intl: IntlShape;
};

export type ContainerProps = PropsFromRouter & PropsFromRedux & PropsFromIntl;

/**
 * Container container wraps any 'container' type from UAPI. such as regular, playlist, subcontainer, channel, etc
 */
export class Container extends Component<ContainerProps> {
  lastMaxScrollTop = 0;

  componentDidMount() {
    // shared from Containers.js, look for way to be more DRY
    this.lastMaxScrollTop = 0;
    addEventListener(window, 'scroll', this.onWindowScroll);
    const { id, isLoggedIn, isKidsModeEnabled, dispatch } = this.props;
    if (id === PERSONAL_COMING_SOON_CONTAINER_ID && isLoggedIn && !isKidsModeEnabled) {
      dispatch(loadReminder());
    }
  }

  componentDidUpdate(prevProps: ContainerProps) {
    if (prevProps.id !== this.props.id) {
      this.lastMaxScrollTop = 0;
    }
  }

  componentWillUnmount() {
    this.onWindowScroll.cancel();
    removeEventListener(window, 'scroll', this.onWindowScroll);
  }

  private onWindowScroll = debounce(() => {
    if (this.obsFilter()) {
      this.loadMoreInContainer();
    }
  }, 30);

  /**
   * observer filter
   * @returns {boolean}
   */
  private obsFilter() {
    const { allLoaded } = this.props;
    if (allLoaded) return false;

    // load more container
    const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

    // no action if above last max scroll position
    if (scrollTop <= this.lastMaxScrollTop) return false;

    this.lastMaxScrollTop = scrollTop;

    const docHeight = document.body.offsetHeight;
    const diff = document.body.scrollHeight - scrollTop - docHeight;

    return diff < docHeight;
  }

  getMeta = () => {
    const { title, id, thumbnail, type, intl } = this.props;
    const titleLowerCase = title?.toLowerCase();
    const description = intl.formatMessage(messages.metaDescription, { titleLowerCase });
    const canonical = getCanonicalLink(getContainerUrl(id, { type }));
    const androidAttribution = `utm_campaign=applink&utm_medium=mobile_web&utm_source=fbapplink&utm_content=${id}`;
    const androidDeepLinkParams = `contentId=${id}`;
    const ogImage = thumbnail ? makeFullUrl(thumbnail) : tubiLogoURL;
    const isChannel = type === CONTAINER_TYPES.CHANNEL;

    return {
      title: intl.formatMessage(messages.metaTitle, { title }),
      description,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        {
          name: 'keywords',
          content: `Watch Free ${titleLowerCase} Movies, Watch Free ${titleLowerCase} TV, Full Length ${titleLowerCase} Movies, Full ${titleLowerCase} TV Series, Online ${titleLowerCase} Movies, Streaming ${titleLowerCase} Movies, HD ${titleLowerCase} Movies`,
        },
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImage },
        { property: 'og:type', content: 'website' },
        { property: 'twitter:title', content: title },
        { property: 'twitter:image', content: ogImage },
        { property: 'twitter:description', content: description },
        // only show the appropriate Deeplink if it is not channel as we do not support it. has to be empty to override default value
        {
          property: 'al:android:url',
          content: isChannel ? '' : `tubitv://media-browse?${androidDeepLinkParams}&${androidAttribution}`,
        },
        { name: 'apple-itunes-app', content: isChannel ? '' : 'app-id=886445756' },
      ],
    };
  };

  private loadMoreInContainer() {
    const { dispatch, id, location } = this.props;
    const isCRM = matchesRoute(WEB_ROUTES.collection, location.pathname);
    dispatch(loadContainer({ location, id, isCRM }));
  }

  trackCb = (index: number) => {
    const { items, id } = this.props;
    const contentId = items[index];
    trackingManager.createNavigateToPageComponent({
      startX: index,
      startY: 0,
      containerSlug: id,
      contentId,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  };

  trackClickLikeContinueEvents = (contentIds: string[]) => {
    const eventObject = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'TILE',
      extraCtx: { isOnboardingCategoryPage: true },
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, eventObject);

    contentIds.forEach((contentId) => {
      trackLikeExplicitInteraction(contentId, undefined, undefined, { isOnboardingCategoryPage: true });
    });
  };

  handleClickLikeContinue = (likedContentIds: Set<string>) => {
    const { dispatch, isLoggedIn } = this.props;
    const contentIds = Array.from(likedContentIds);
    const userPreferencesRef = {
      dislike_selections: {
        contents: [],
      },
      preference_selections: {
        contents: contentIds,
      },
      skip_selections: {
        contents: [],
      },
    };
    saveUserPreferences(userPreferencesRef);
    if (isLoggedIn) {
      dispatch(addReactionForMultiTitles(contentIds, 'like'));
    }
    this.trackClickLikeContinueEvents(contentIds);
    tubiHistory.push({ pathname: WEB_ROUTES.home, state: { from: SUBMITTED_PERSONALIZATION } });
  };

  render() {
    const { intl, items, type, id, backgrounds, logo, externalUrl, isMobile, videos, shouldShowSelectableOnboardingTile } = this.props;
    let { title, description } = this.props;
    const isLikedSelectableTile = shouldShowSelectableOnboardingTile && id === ONBOARDING_PREFERENCES_CONTAINER_ID;
    if (isLikedSelectableTile) {
      title = intl.formatMessage(messages.onboardingReferenceContainerTitle);
      description = intl.formatMessage(messages.onboardingReferenceContainerDescription);
    }
    // Web platform supports some containers that are not in homescreen, so we need some extra protection in case
    // a non-homescreen container is rendered when homescreen containers are overwriting our redux store
    // todo - remove FD and enforce a 'loading' state for every ReactContainer
    if (!title) return null;

    const meta = this.getMeta();
    const isChannel = type === CONTAINER_TYPES.CHANNEL;
    const backgroundImage = (backgrounds || [])[0];

    const containerProps = {
      title,
      items,
      description,
      type,
      id,
      trackCb: this.trackCb,
      isMobile,
      isLikedSelectableTile,
      likeContinueButtonText: intl.formatMessage(messages.likeContinueButtonText),
      handleClickLikeContinue: this.handleClickLikeContinue,
    };

    return (
      <div>
        <Helmet {...meta} />
        {isChannel ? (
          <WebChannel {...containerProps} backgroundImage={backgroundImage} logo={logo} externalUrl={externalUrl} />
        ) : (
          <Fragment>
            <WebContainer {...containerProps} />
            <MovieItemListSchema videos={videos} />
          </Fragment>
        )}
        <FloatingCastButton />
        <Footer useRefreshStyle />
      </div>
    );
  }
}

export const mapStateToProps = (state: StoreState, ownProps: PropsFromRouter): Omit<PropsFromRedux, 'dispatch'> => {
  const { auth, ui } = state;
  const shouldShowSelectableOnboardingTile = shouldShowPersonalizationPromptSelector(state);
  const { location: { pathname }, params: { id } } = ownProps;
  const {
    containerIdMap = {},
    containerLoadIdMap = {},
    containerChildrenIdMap = {},
  } = containerSelector(state, {
    forceCurrentMode: contentModeForMenuListSelector(state, { pathname }),
    pathname,
  });
  const containerMeta = containerIdMap[id] || {};
  // cursor is null when container is all loaded
  const { cursor } = containerLoadIdMap[id] || {};

  const { isKidsModeEnabled, isMobile } = ui;

  const { title, description, slug, type, thumbnail, backgrounds, logo, externalUrl } = containerMeta;
  const containerContents = containerChildrenIdMap[id] || FREEZED_EMPTY_ARRAY;
  const videos = videosByIdsSelector(state, containerContents);

  return {
    id,
    slug,
    isLoggedIn: !!(auth && auth.user),
    items: containerContents,
    type,
    title,
    thumbnail,
    description,
    allLoaded: cursor === null,
    backgrounds,
    logo,
    externalUrl,
    isKidsModeEnabled,
    isMobile,
    videos,
    shouldShowSelectableOnboardingTile,
  };
};

export function fetchData({ dispatch, params, getState, location }: FetchDataParams<{ id: string }>) {
  const { id: contId } = params;
  const promises = [];
  const state = getState();
  const currentContentMode = contentModeForMenuListSelector(state, { pathname: location.pathname });
  const { containerLoadIdMap } = containerSelector(state, { forceCurrentMode: currentContentMode, pathname: location.pathname });
  const { cursor = 0 } = containerLoadIdMap[contId] || {};

  // raise default limit for fetchData, make sure page is full of contents
  // todo(liam) improve scroll handler, this should not be necessary
  const limit = 50;
  if (cursor !== null && cursor < limit) {
    promises.push(
      dispatch(loadContainer({ location, id: contId, expand: 0, limit, contentMode: currentContentMode, isCRM: matchesRoute(WEB_ROUTES.collection, location.pathname) }))
    );
  }
  dispatch(setContainerContext(contId, currentContentMode));

  return Promise.all(promises).catch((err) => {
    const loggerType = getLogLevel(err.errType);
    logger[loggerType]({ error: err, containerId: contId }, 'error when loading data for the Container');
    return Promise.reject(err);
  });
}

const connectedComponent = connect(mapStateToProps)(injectIntl(Container));
(connectedComponent as TubiContainerFC<ContainerProps, { id: string }>).fetchData = fetchData;
(connectedComponent as TubiContainerFC<ContainerProps, { id: string }>).hasDynamicMeta = true;

export default connectedComponent;
