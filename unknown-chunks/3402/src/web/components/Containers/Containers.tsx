/* istanbul ignore file */
import { createRefMapRef, createGetChildRef } from '@adrise/utils/lib/useRefMap';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { ContentRowPlaceholder } from '@tubitv/ott-ui';
import { Button, EnterExitTransition } from '@tubitv/web-ui';
import debounce from 'lodash/debounce';
import type { CSSProperties } from 'react';
import React, { Component } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';
import { TransitionGroup } from 'react-transition-group';

import { parseUrl } from 'client/utils/clientTools';
import { loadContainer, lazyloadHomeScreen, setContainerContext } from 'common/actions/container';
import { setRenderedContainersCount, setTileIndexInContainer } from 'common/actions/ui';
import { persistDismissedPrompt } from 'common/actions/webUI';
import {
  CONTAINER_TYPES,
  HISTORY_CONTAINER_ID,
  QUEUE_CONTAINER_ID,
  ONBOARDING_PREFERENCES_CONTAINER_ID,
  CW_FOR_REGISTRATION_CONTAINER_ID,
  CONTENT_MODES,
} from 'common/constants/constants';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { CONTAINER_GRID_ITEM_VERTICAL_MARGIN_REM } from 'common/constants/style-constants';
import WebCwRowForGuestUsers from 'common/experiments/config/webCwRowForGuestUsers';
import WebPersonalizationPrompt from 'common/experiments/config/webPersonalizationPrompt';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { shouldShowPurpleCarpetOnHomeScreenSelector } from 'common/features/purpleCarpet/selectors/shouldShowPurpleCarpetSelector';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import withExperiment from 'common/HOCs/withExperiment';
import {
  containerSelector,
  isContainersListFullyLoaded,
  homeContainerSelector,
  webMyStuffContainerSelector,
} from 'common/selectors/container';
import { currentContentModeSelector, contentModeForMenuListSelector } from 'common/selectors/contentMode';
import { isWebEpgEnabledSelector } from 'common/selectors/epg';
import { shouldShowPersonalizationPromptSelector, isTargetedUserSelector } from 'common/selectors/experiments/webPersonalizationPrompt';
import trackingManager from 'common/services/TrackingManager';
import { ContainerChildType, ContainerType } from 'common/types/container';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { buildDialogEvent } from 'common/utils/analytics';
import { getViewportHeight } from 'common/utils/containerTools';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { getWebEpgUrl } from 'common/utils/epg';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getContentModeFromPath } from 'common/utils/routePath';
import { trackEvent } from 'common/utils/track';
import { getContainerUrl } from 'common/utils/urlConstruction';
import Prompt from 'web/components/Prompt/Prompt';
import HomeContainerRow from 'web/rd/components/HomeContainerRow/HomeContainerRow';
import type { FirstSeen } from 'web/utils/webFirstSession';
import { getIsWebFirstSession } from 'web/utils/webFirstSession';

import styles from './Containers.scss';

const messages = defineMessages({
  cwTitle: {
    description: 'Continue Watching row title',
    defaultMessage: 'Continue Watching',
  },
  loading: {
    description: 'text indicating content is loading',
    defaultMessage: 'Loading...',
  },
  loadMore: {
    description: 'load more tv/movie titles button text',
    defaultMessage: 'Load More',
  },
  failed: {
    description: 'loading more titles failed messaging',
    defaultMessage: 'Failed... Try again?',
  },
  promptTitle: {
    description: 'This is the prompt title',
    defaultMessage: 'Need help finding something to watch?',
  },
  promptButton: {
    description: 'Start Now',
    defaultMessage: 'Start Now',
  },
});

const DISTANCE_TO_VIEWPORT = 200;
const CW_ROW_POSITION_FOR_GUEST = 5;

const scrollMap = new Map<string, number>();

type OwnProps = {
  contentMode?: CONTENT_MODE_VALUE;
  isMyStuffPage?: boolean;
  containersListFullyLoaded?: boolean;
  isEnabledNewFeatureBillboard?: boolean;
};

type StateProps = {
  containersListFullyLoaded: boolean;
  containers: {
    id: string;
    title: string;
    slug: string;
    childType: ContainerChildType;
    contents: string[];
    type: ContainerType;
    logo: string | undefined;
  }[];
  renderedContainersCount: number;
  containerIndexMap: Record<string, number>;
  videoDetailFullyLoaded: boolean;
  containerChildrenIdMap: Record<string, string[]>;
  isWebEpgEnabled: boolean;
  currentContentMode: CONTENT_MODE_VALUE;
  shouldShowPersonalizationPrompt: boolean;
  isTargetedUser: boolean;
  isHomePage: boolean;
  firstSeen: FirstSeen;
  isLoggedIn: boolean;
  isPurpleCarpetRowEnabled?: boolean;
  personalizationId?: string;
};

type ExperimentProps = {
  webPersonalizationPrompt: ReturnType<typeof WebPersonalizationPrompt>;
  webCwRowForGuestUsers: ReturnType<typeof WebCwRowForGuestUsers>;
};

export type Props = OwnProps & StateProps & ExperimentProps & WithRouterProps & {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
};

export interface TrackTriggerClickParams {
  startX: number;
  endX: number;
  contentId: string;
  containerId: string;
  rowIndex: number;
}

export interface StoreContainerParams {
  index: number;
  containerId: string;
}

export class Containers extends Component<Props> {

  buttonStateText = {
    LOADING: this.props.intl.formatMessage(messages.loading),
    LOAD_MORE: this.props.intl.formatMessage(messages.loadMore),
    TRY_AGAIN: this.props.intl.formatMessage(messages.failed),
  };

  state = {
    initContainerCount: 0,
    loadButtonText: this.buttonStateText.LOAD_MORE,
    isLoadMorePending: false,
    prevContentMode: '',
    pageScrollPositions: {},
    isPersonalizationPromptOpen: false,
  };

  elContainer: Element | null;

  elLoadMore: Element | null = null;

  onWindowScroll?: ReturnType<typeof debounce>;

  loadMoreTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {});

  private homeContainerRowNodeRefMap = createRefMapRef<HTMLDivElement | null>();

  private gethomeContainerRowNodeRef = createGetChildRef(this.homeContainerRowNodeRefMap, null);

  constructor(props: Props) {
    super(props);

    this.elContainer = null;
    this.storeContainerPosition = this.storeContainerPosition.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /* istanbul ignore next */
  handleResize() {
    Object.keys(CONTENT_MODES).forEach((contentMode: string) =>
      scrollMap.delete(contentMode)
    );
  }

  /* istanbul ignore next */
  componentDidUpdate(prevProps: Props) {
    const { videoDetailFullyLoaded, containersListFullyLoaded, currentContentMode } = this.props;
    const { isLoadMorePending, prevContentMode } = this.state;
    // if all video data and container list has loaded and the user has clicked "load more", render more content
    if (videoDetailFullyLoaded && containersListFullyLoaded && isLoadMorePending) {
      this.setState({
        isLoadMorePending: false,
        loadButtonText: this.buttonStateText.LOAD_MORE,
      });
      this.startRenderProgressively();
    }

    if (prevProps.currentContentMode !== currentContentMode) {
      this.handleLoadClick();
    }

    const scrollPosition = scrollMap.get(currentContentMode);
    if (
      prevContentMode !== currentContentMode &&
      currentContentMode === getContentModeFromPath(parseUrl().pathname) &&
      scrollPosition &&
      videoDetailFullyLoaded
    ) {
      this.setState({ prevContentMode: currentContentMode }, () => {
        clearTimeout(this.loadMoreTimeout);
        this.loadMoreTimeout = setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 500);
        addEventListener(window, 'resize', this.handleResize);
      });
    }
  }

  attachScrollHandler() {
    this.removeScroll();
    // store the scroll position, used to check scroll direction
    this.onWindowScroll = debounce(() => {
      const box = this.elContainer!.getBoundingClientRect();
      const viewportHeight = getViewportHeight();
      const shouldIncreaseContainerNum = box.bottom <= viewportHeight + DISTANCE_TO_VIEWPORT;
      const { renderedContainersCount, currentContentMode } = this.props;
      const { initContainerCount } = this.state;

      if (shouldIncreaseContainerNum && renderedContainersCount > initContainerCount!) {
        this.increaseContainerNum();
      }
      if (window.scrollY) {
        scrollMap.set(currentContentMode, window.scrollY);
      }
    }, 50);
    addEventListener(window, 'scroll', this.onWindowScroll);
  }

  componentDidMount() {
    this.attachScrollHandler();
    this.setState({
      initContainerCount: 0,
    });
    const { isTargetedUser } = this.props;
    if (isTargetedUser) {
      this.showPersonalizationPrompt();
    }
  }

  private removeScroll(): void {
    if (this.onWindowScroll) {
      removeEventListener(window, 'scroll', this.onWindowScroll);
      this.onWindowScroll.cancel();
      this.onWindowScroll = undefined;
    }
    clearTimeout(this.loadMoreTimeout);
    removeEventListener(window, 'resize', this.handleResize);
  }

  componentWillUnmount() {
    this.removeScroll();
  }

  loadMore = (id: string) => {
    const { location } = this.props;
    // pass expand 0 so we don't load child container contents
    this.props.dispatch(loadContainer({ location, id, expand: 0 }));
  };

  shouldRunWebCwRowForGuestUsers = (): boolean => {
    const { firstSeen, isLoggedIn, isMyStuffPage } = this.props;
    const isWebFirstSession = getIsWebFirstSession(firstSeen);
    if (isMyStuffPage || isWebFirstSession || isLoggedIn) {
      return false;
    }
    return true;
  };

  shouldEnableWebCwRowForGuestUsers = (): boolean => {
    const { containers, renderedContainersCount } = this.props;
    return this.shouldRunWebCwRowForGuestUsers() && Math.min(containers.length, renderedContainersCount) >= CW_ROW_POSITION_FOR_GUEST;
  };

  shouldLogForWebCwRowForGuestUsers = (index: number): boolean => {
    return this.shouldRunWebCwRowForGuestUsers() && index === CW_ROW_POSITION_FOR_GUEST;
  };

  getContainerShowingRow = (): StateProps['containers'] => {
    const { containers, renderedContainersCount, webCwRowForGuestUsers, intl } = this.props;
    const currentContainers = containers.slice(0, renderedContainersCount);
    if (this.shouldEnableWebCwRowForGuestUsers() && webCwRowForGuestUsers.getValue()) {
      currentContainers.splice(CW_ROW_POSITION_FOR_GUEST, 0, {
        id: CW_FOR_REGISTRATION_CONTAINER_ID,
        title: intl.formatMessage(messages.cwTitle),
        slug: '',
        childType: ContainerChildType.content,
        contents: [],
        type: ContainerType.continue_watching,
        logo: undefined,
      });
    }

    return currentContainers;
  };

  /* istanbul ignore next */
  trackCb = ({ containerPosition, containerSlug, contId, column }: {
    containerPosition: number;
    containerSlug: string;
    contId: string;
    column: number;
  }) => {
    const { containerChildrenIdMap, currentContentMode } = this.props;
    trackingManager.createNavigateToPageComponent({
      startX: column,
      startY: containerPosition + 1, // Doing the + 1 here for web, because of featured container in the hero section.
      containerSlug,
      contentId: containerChildrenIdMap[containerSlug][column],
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });

    this.props.dispatch(setContainerContext(contId, currentContentMode));
  };

  /**
   * Adaptation of trackCb for web refresh HomeContainerRow
   */
  handleCarouselNavigation = ({ containerPosition, containerSlug, containerId, index }: {
    containerPosition: number;
    containerSlug: string;
    containerId: string;
    index: number;
  }) => {
    this.trackCb({ containerPosition, containerSlug, contId: containerId, column: index });
  };

  assignRef = (el: HTMLDivElement) => {
    this.elContainer = el;
  };

  // remember the user's position in this container
  storeContainerPosition({ index, containerId }: StoreContainerParams) {
    this.props.dispatch(setTileIndexInContainer({
      containerId,
      index,
      shouldDisablePreviewsWhileScrolling: false,
    }));
  }

  // Track NavigateWithinPage event when click the left or right arrow button of the container Carousel
  /* istanbul ignore next */
  trackTriggerClick({ startX, endX, contentId, containerId, rowIndex }: TrackTriggerClickParams) {
    const { isMyStuffPage } = this.props;
    let startY = rowIndex;
    if (isMyStuffPage) {
      if (containerId === HISTORY_CONTAINER_ID) {
        startY = 0;
      } else if (containerId === QUEUE_CONTAINER_ID) {
        startY = 1;
      }
    }
    trackingManager.sendNavigateWithinPage({
      startX,
      startY,
      endX,
      endY: startY,
      contentId,
      containerId,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  }

  /**
   * Adaptation of trackTriggerClick for web refresh HomeContainerRow
   */
  handleCarouselIndexChange = ({
    containerId,
    containerPosition,
    containerSlug,
    startIndex,
    endIndex,
  }: {
    containerId: string,
    containerPosition: number,
    containerSlug: string,
    startIndex: number,
    endIndex: number,
  }) => {
    const { containerChildrenIdMap } = this.props;
    // Content id for _previous_ first column of carousel
    const contentId = containerChildrenIdMap[containerSlug][startIndex];
    this.trackTriggerClick({
      startX: startIndex,
      endX: endIndex,
      contentId,
      containerId,
      // Offset to account for featured container
      rowIndex: containerPosition + 1,
    });
  };

  increaseContainerNum() {
    const { currentContentMode, renderedContainersCount, containers, dispatch } = this.props;
    dispatch(setRenderedContainersCount(currentContentMode, Math.min(renderedContainersCount + 4, containers.length)));
  }

  showPersonalizationPrompt() {
    const { shouldShowPersonalizationPrompt, webPersonalizationPrompt } = this.props;
    webPersonalizationPrompt.logExposure();
    if (!this.state.isPersonalizationPromptOpen && shouldShowPersonalizationPrompt) {
      this.setState({ isPersonalizationPromptOpen: true });
      trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'personalization', DialogAction.SHOW));
    }
  }

  handlePersonalizationPromptDismiss() {
    const { dispatch } = this.props;
    this.setState({ isPersonalizationPromptOpen: false });
    dispatch(persistDismissedPrompt(true));
    trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'personalization', DialogAction.DISMISS_DELIBERATE));
  }

  handlePersonalizationPromptContinue() {
    tubiHistory.push(`${WEB_ROUTES.container}/${ONBOARDING_PREFERENCES_CONTAINER_ID}`);
    trackEvent(eventTypes.DIALOG, buildDialogEvent(getCurrentPathname(), DialogType.INFORMATION, 'personalization', DialogAction.ACCEPT_DELIBERATE));
  }

  startRenderProgressively() {
    this.increaseContainerNum();
  }

  // attach scroll handler and render more rows, set UI to store loaded count
  handleLoadClick = () => {
    return new Promise<string | void>((resolve, reject) => {
      const { dispatch, videoDetailFullyLoaded, containersListFullyLoaded, location } = this.props;
      const errorHandler = (error: unknown) => {
        logger.error(error, 'fetchData error - Home');
        this.setState({
          isLoadMorePending: false,
          loadButtonText: this.buttonStateText.TRY_AGAIN,
        });
        reject(error);
      };

      if (containersListFullyLoaded && videoDetailFullyLoaded) {
        resolve();
        this.startRenderProgressively();
      } else {
        // handle the situation when the `loadHomeScreen` fails in Home CDM, send another request when the user clicks "load more" button
        if (!this.state.isLoadMorePending) {
          this.setState({
            isLoadMorePending: true,
            loadButtonText: this.buttonStateText.LOADING,
          });
        }
        dispatch(lazyloadHomeScreen({ location })).then(resolve).catch(errorHandler);
      }
    });
  };

  render() {
    const { isEnabledNewFeatureBillboard, currentContentMode, isHomePage, containers, isMyStuffPage, renderedContainersCount, containerIndexMap, isWebEpgEnabled, containersListFullyLoaded, intl, personalizationId, isPurpleCarpetRowEnabled } = this.props;
    const { isLoadMorePending, initContainerCount, loadButtonText, isPersonalizationPromptOpen } = this.state;

    // if we have clicked load more, rendered count will be larger; don't show Load More, start rendering more
    const loadMoreClicked = renderedContainersCount > initContainerCount!;

    // all_containers_already_rendered || loadMore_clicked
    const hideHasMore = isMyStuffPage || (containersListFullyLoaded && containers.length <= renderedContainersCount) || loadMoreClicked;

    const containerShowingRows = this.getContainerShowingRow();
    const ContainerGridPlaceholder = React.memo(() => {
      const containerTileWrapperStyle: CSSProperties = {
        marginBottom: `${CONTAINER_GRID_ITEM_VERTICAL_MARGIN_REM}rem`,
        marginLeft: '0.5vw',
        position: 'relative',
        display: 'block',
      };

      return (
        <>
          {
            Array.from({ length: 4 }, (_, key) => (
              <ContentRowPlaceholder style={containerTileWrapperStyle} key={`content-placeholder-${key}`} />
            ))
          }
        </>
      );
    });

    return (
      <div ref={this.assignRef} className={isEnabledNewFeatureBillboard && !isPurpleCarpetRowEnabled ? styles.isEnabledNewFeatureBillboard : ''}>
        <div className={styles.main}>
          {(!renderedContainersCount ? <ContainerGridPlaceholder /> :
            (<React.Fragment><TransitionGroup component="div" exit={false}>
              {
                containerShowingRows.map((container, idx) => {
                  const { contents, id, slug, title, type, logo } = container;
                  const to = type === CONTAINER_TYPES.LINEAR && isWebEpgEnabled
                    ? getWebEpgUrl(id)
                    : getContainerUrl(id, { type });

                  const key = `${isMyStuffPage ? 'my-stuff' : currentContentMode}-${id}`;

                  // find initialIndex from state. Carousel ui component manages this after initial mount
                  const indexInContainer = containerIndexMap[id] || 0;
                  const isFourthContainer = idx === 3;
                  const noDivider = (isEnabledNewFeatureBillboard || isPurpleCarpetRowEnabled) && idx === 0;

                  return (
                    <EnterExitTransition key={key} in entranceTransition="slideInUp" nodeRef={this.gethomeContainerRowNodeRef(key)}>
                      <HomeContainerRow
                        ref={this.gethomeContainerRowNodeRef(key)}
                        className={isFourthContainer ? 'isFourthContainer' : ''}
                        key={key}
                        containerId={id}
                        containerSlug={slug}
                        containerTitle={title}
                        containerPosition={idx}
                        containerType={type}
                        containerHref={to}
                        containerContents={contents}
                        containerLogo={logo}
                        indexInContainer={indexInContainer}
                        initialIndex={indexInContainer}
                        onCarouselIndexChange={this.handleCarouselIndexChange}
                        onStoreContainerPosition={this.storeContainerPosition}
                        onLoadMore={this.loadMore}
                        onNavigation={this.handleCarouselNavigation}
                        isMyStuffPage={isMyStuffPage}
                        logForWebCwRowForGuestUsers={this.shouldLogForWebCwRowForGuestUsers(idx)}
                        personalizationId={personalizationId}
                        noDivider={noDivider}
                      />
                    </EnterExitTransition>
                  );
                })
              }
            </TransitionGroup>
              {
                hideHasMore ? null : (
                  <div className={styles.center}>
                    <Button
                      appearance="tertiary"
                      disabled={isLoadMorePending}
                      onClick={this.handleLoadClick}
                    >
                      {loadButtonText}
                    </Button>
                  </div>
                )
              }
            </React.Fragment>)
          )}
          { isHomePage ? <Prompt
            isOpen={isPersonalizationPromptOpen}
            onDismiss={() => this.handlePersonalizationPromptDismiss()}
            onContinue={() => this.handlePersonalizationPromptContinue()}
            title={intl.formatMessage(messages.promptTitle)}
            buttonText={intl.formatMessage(messages.promptButton)}
          /> : null}
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (state: StoreState, props: OwnProps & Pick<WithRouterProps, 'location'>) => {
  const { contentMode, isMyStuffPage, location: { pathname } } = props;
  const {
    ui: { renderedContainersCount, containerIndexMap },
    auth: { firstSeen },
  } = state;
  const currentContentMode = contentMode || currentContentModeSelector(state, { pathname });
  const container = containerSelector(state, { forceCurrentMode: contentMode, pathname });
  const { containerLoadIdMap, containerChildrenIdMap } = container;
  const videoDetailFullyLoaded = containerLoadIdMap ? Object.keys(containerLoadIdMap).every(key => containerLoadIdMap[key].loaded) : false;
  const shouldShowPersonalizationPrompt = shouldShowPersonalizationPromptSelector(state);
  const isTargetedUser = isTargetedUserSelector(state);
  const isHomePage = props.location.pathname === WEB_ROUTES.home;
  const isLoggedIn = isLoggedInSelector(state);
  const isPurpleCarpetRowEnabled = shouldShowPurpleCarpetOnHomeScreenSelector(state, { pathname });

  return {
    containersListFullyLoaded: isContainersListFullyLoaded(container),
    containers: isMyStuffPage
      ? webMyStuffContainerSelector(state, {
        forceCurrentMode: contentModeForMenuListSelector(state, { pathname }),
        pathname,
      })
      : homeContainerSelector(state, { forceCurrentMode: contentMode, pathname }),
    renderedContainersCount: renderedContainersCount[currentContentMode] ?? 0,
    containerIndexMap,
    videoDetailFullyLoaded,
    containerChildrenIdMap,
    isWebEpgEnabled: isWebEpgEnabledSelector(state),
    currentContentMode,
    shouldShowPersonalizationPrompt,
    isTargetedUser,
    isHomePage,
    firstSeen,
    isLoggedIn,
    personalizationId: container.personalizationId,
    isPurpleCarpetRowEnabled,
  };
};

const ConnectedContainers = connect(mapStateToProps)(Containers);

export default withRouter(withExperiment(injectIntl(ConnectedContainers), {
  webPersonalizationPrompt: WebPersonalizationPrompt,
  webCwRowForGuestUsers: WebCwRowForGuestUsers,
}));
