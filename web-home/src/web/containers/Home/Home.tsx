import { setAutoplayCapability } from '@adrise/player/lib/action';
import { isExpectedType } from '@adrise/utils/lib/tools';
import classNames from 'classnames';
import type { Location } from 'history';
import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, useIntl } from 'react-intl';

import { preloadPurplescripts } from 'client/utils/preloadPurpleCarpetScripts';
import { getData, setData } from 'client/utils/sessionDataStorage';
import { loadHomeScreen, lazyloadHomeScreen } from 'common/actions/container';
import { loadHistory } from 'common/actions/history';
import { persistIsValidUserForPersonalization } from 'common/actions/webUI';
import { RESET_UI_CONTAINER_INDEX_MAP } from 'common/constants/action-types';
import { CONTENT_MODES, HOME_DATA_SCOPE } from 'common/constants/constants';
import { SUBMITTED_PERSONALIZATION } from 'common/constants/cookies';
import { WEB_ROUTES } from 'common/constants/routes';
import WebFeaturedRow from 'common/experiments/config/webFeaturedRow';
import WebNewFeaturedBillboard, { FEATURED_BILLBOARD_CONTROL } from 'common/experiments/config/webNewFeaturedBillboard';
import WebVideoPreview from 'common/experiments/config/webVideoPreview';
import { handleSignOutEvent } from 'common/features/authentication/utils/signOutStatus';
import { loadListing, updatePurpleCarpetStatus } from 'common/features/purpleCarpet/action';
import { usePurpleCarpetStatus } from 'common/features/purpleCarpet/hooks/usePurpleCarpetStatus';
import { mainGameSelector } from 'common/features/purpleCarpet/selector';
import { shouldShowPurpleCarpetOnHomeScreenSelector } from 'common/features/purpleCarpet/selectors/shouldShowPurpleCarpetSelector';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { useUpdateCurrentDateByMinute } from 'common/hooks/useCurrentDate';
import useExperiment from 'common/hooks/useExperiment';
import { useSyncExpiredContainers } from 'common/hooks/useSyncExpiredContainers';
import { webContentModeSelector } from 'common/selectors/contentMode';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import type { TubiContainerFC } from 'common/types/tubiFC';
import { actionWrapper } from 'common/utils/action';
import { detectAutoplay } from 'common/utils/autoplayDetection';
import { alwaysResolve } from 'common/utils/promise';
import { getContentModeFromPath } from 'common/utils/routePath';
import { trimTrailingSlash, hasLocalePrefix, removeLocalePrefix } from 'common/utils/urlManipulation';
import Containers from 'web/components/Containers/Containers';
import FloatingCastButton from 'web/components/FloatingCastButton/FloatingCastButton';
import Footer from 'web/components/Footer/Footer';
import { PurpleCarpetDetails } from 'web/features/purpleCarpet/components/PurpleCarpetDetails/PurpleCarpetDetails';
import OrganizationSchema from 'web/features/seo/components/OrganizationSchema/OrganizationSchema';
import { getCanonicalLink, getCanonicalMetaByLink, getAlternateMeta } from 'web/features/seo/utils/seo';
import FeaturedBillboard from 'web/rd/containers/FeaturedBillboard/FeaturedBillboard';

import styles from './Home.scss';

const messages = defineMessages({
  title: {
    description: 'title of the web page, metadata',
    defaultMessage: 'Watch Free Movies and TV Shows Online | Tubi',
  },
  description: {
    description: 'description of the web page, meta data',
    defaultMessage:
      'Watch free movies and TV shows online in HD on any device. Tubi offers streaming movies in genres like Action, Horror, Sci-Fi, Crime and Comedy. Watch now.',
  },
  moviesTitle: {
    description: 'title of the movies page, metadata',
    defaultMessage: 'Watch Free Movies Online | Tubi TV',
  },
  moviesDescription: {
    description: 'description of the movies page, metadata',
    defaultMessage:
      'Watch movies for FREE on Tubi. Tubi offers more than 40,000 full movies in genres like Action, Horror, Sci-Fi, Crime and Originals. Stream Now.',
  },
  tvShowsTitle: {
    description: 'title of the movies page, metadata',
    defaultMessage: 'Watch Free TV Shows Online | Tubi TV',
  },
  tvShowsDescription: {
    description: 'description of the TV shows page, metadata',
    defaultMessage:
      'Watch TV shows for FREE on Tubi. Tubi offers more than 40,000 full TV shows in genres like Action, Horror, Sci-Fi, Crime and Originals. Stream Now.',
  },
  keywords: {
    description: 'keywords for home page, meta data',
    defaultMessage: 'Free, Movies, TV shows, legal, streaming, HD, full length, full movie',
  },
});

const pathnameTitleDescriptionMap = {
  '': ['title', 'description'], // TODO: remove this line with the web remove landing experiment code.
  [WEB_ROUTES.home]: ['title', 'description'],
  [WEB_ROUTES.movies]: ['moviesTitle', 'moviesDescription'],
  [WEB_ROUTES.tvShows]: ['tvShowsTitle', 'tvShowsDescription'],
};

export const HOME_RELATED_PAGE_PATHNAME = 'home_related_path_name';

const Home: TubiContainerFC = ({ location }) => {
  const intl = useIntl();
  const webVideoPreview = useExperiment(WebVideoPreview);
  const webFeaturedRow = useExperiment(WebFeaturedRow);

  const dispatch = useAppDispatch();
  const canAutoplay = useAppSelector(state => state.player.canAutoplay);
  const videoPreviewMuted = useAppSelector(state => state.player.videoPreviewMuted);
  const contentMode = getContentModeFromPath(location.pathname);
  const webNewFeaturedBillboard = useExperiment(WebNewFeaturedBillboard);
  const viewportType = useAppSelector(state => state.ui.viewportType);
  const isDesktopViewport = viewportType === 'desktop';
  const webNewFeaturedBillboardValue = webNewFeaturedBillboard.getValue();
  const isDefaultFeatureBillboard = !isDesktopViewport || webNewFeaturedBillboardValue === FEATURED_BILLBOARD_CONTROL;
  const showPurpleCarpetRow = useAppSelector(state => shouldShowPurpleCarpetOnHomeScreenSelector(state, { pathname: location.pathname }));
  const mainGameId = useAppSelector(mainGameSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);

  useUpdateCurrentDateByMinute();

  useSyncExpiredContainers(contentMode);

  usePurpleCarpetStatus();

  useEffect(() => {
    if (showPurpleCarpetRow && !isMobile) {
      preloadPurplescripts();
    }
  }, [showPurpleCarpetRow, isMobile]);

  useEffect(() => {
    const fetchData = async () => {
      /* istanbul ignore next */
      await dispatch(lazyloadHomeScreen({ location })).catch((error) => {
        logger.error({ error }, 'fetchData error - Home');
        return Promise.reject(error);
      });
    };
    fetchData();
  }, [dispatch, location]);

  useEffect(() => {
    handleSignOutEvent();
  }, []);

  useEffect(() => {
    if (!canAutoplay) {
      // Detect if it is available to autostart to make sure the video preview is working
      detectAutoplay({ muted: videoPreviewMuted }).then((canPlay) => {
        dispatch(setAutoplayCapability(canPlay));
        if (canPlay) {
          webVideoPreview.logExposure();
        }
      });
    } else {
      webVideoPreview.logExposure();
    }
  }, [canAutoplay, dispatch, videoPreviewMuted, webVideoPreview]);

  useEffect(() => {
    webFeaturedRow.logExposure();
  }, [webFeaturedRow]);

  useEffect(() => {
    const currentPathname = location.pathname;
    const prevPathname = getData(HOME_RELATED_PAGE_PATHNAME);
    // Cause this container is used by three page: home, movie, tv-shows
    // we need to reset the container index map when the component update in these three page
    // but we also need to keep the state if user go to detail page, player page or category page
    // we cannot use contentMode and location for the case user homepage->scroll container->go to detail page -> got to movies page
    if (currentPathname !== prevPathname) {
      setData(HOME_RELATED_PAGE_PATHNAME, currentPathname);
      dispatch(actionWrapper(RESET_UI_CONTAINER_INDEX_MAP));
    }
  }, [dispatch, location.pathname]);

  const meta = useMemo(() => {
    const pathname = __TESTING__ && !location ? WEB_ROUTES.home : trimTrailingSlash(location.pathname);
    const canonical = getCanonicalLink(pathname);
    const pageType = removeLocalePrefix(pathname);
    let titleDescriptionKeys = pathnameTitleDescriptionMap[pageType];
    if (!titleDescriptionKeys) {
      titleDescriptionKeys = pathnameTitleDescriptionMap[WEB_ROUTES.home];
      logger.error('titleDescriptionKeys is empty, falling back to default home title and description');
    }
    const titleKey = titleDescriptionKeys[0];
    const descriptionKey = titleDescriptionKeys[1];
    const title = intl.formatMessage(messages[titleKey]);
    const description = intl.formatMessage(messages[descriptionKey]);

    return {
      title,
      link: [
        getCanonicalMetaByLink(canonical),
        ...((location.pathname === WEB_ROUTES.home || hasLocalePrefix(pathname)) ? getAlternateMeta(WEB_ROUTES.home) : []),
      ],
      meta: [
        { name: 'keywords', content: intl.formatMessage(messages.keywords) },
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        {
          property: 'al:android:url',
          content: 'tubitv://open?utm_campaign=organic&utm_medium=mobile_web&utm_source=mobile_web',
        },
      ],
    };
  }, [intl, location]);

  const useContainerRowForFeatured = webFeaturedRow.getValue() || showPurpleCarpetRow;

  return (
    <div
      className={classNames(styles.home, {
        [styles.noFeaturedBillboard]: webFeaturedRow.getValue() && !showPurpleCarpetRow,
      })}
    >
      <Helmet {...meta} />
      {showPurpleCarpetRow && mainGameId ? <PurpleCarpetDetails type="row" id={mainGameId} /> : null}
      {location.pathname === WEB_ROUTES.home ? <OrganizationSchema /> : null}
      {useContainerRowForFeatured ? null : <FeaturedBillboard />}
      <Containers isEnabledNewFeatureBillboard={!isDefaultFeatureBillboard} />
      <FloatingCastButton />
      <Footer useRefreshStyle />
    </div>
  );
};

Home.fetchData = ({ getState, dispatch, location }) => {
  const state = getState();
  const { auth } = state;
  const isLoggedIn = !!(auth && auth.user);
  const contentMode = webContentModeSelector(state, { pathname: location.pathname });
  const fromPersonalizationPage = isExpectedType<Location>(location, ['state', 'action']) && location.state?.from === SUBMITTED_PERSONALIZATION && location.action === 'PUSH';

  const loadPurpleCarpetContainer = async () => {
    await dispatch(
      loadHomeScreen({
        location,
        scope: HOME_DATA_SCOPE.firstScreen,
        contentMode,
        force: isExpectedType<Location>(location, ['state', 'action']) && location.state?.from === SUBMITTED_PERSONALIZATION && location.action === 'PUSH',
      })
    );
    if (contentMode === CONTENT_MODES.all) {
      await alwaysResolve(dispatch(loadListing()));
    }
  };

  const promises: Promise<unknown>[] = [loadPurpleCarpetContainer()];

  if (isLoggedIn || __ISOTT__) promises.push(alwaysResolve(dispatch(loadHistory())));

  return Promise.all(promises)
    .then(() => {
      dispatch(updatePurpleCarpetStatus());
      if (fromPersonalizationPage) {
        dispatch(persistIsValidUserForPersonalization(false));
      }
    })
    .catch((error) => {
      logger.error({ error }, 'fetchData error - Home');
      throw error;
    });
};

export default Home;
