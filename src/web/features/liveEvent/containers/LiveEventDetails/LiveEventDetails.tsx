/* istanbul ignore file */
import classnames from 'classnames';
import React, { useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';

import { CONTAINER_ID_FOR_LIVE_EVENT_RELATED, CONTAINER_ID_FOR_RELATED_RANKING, RELATED_CONTENTS_LIMIT_LEGACY } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLiveEvent } from 'common/features/liveEvent/hooks/useLiveEvent';
import { LiveEventContentStatus } from 'common/features/liveEvent/types';
import useAppSelector from 'common/hooks/useAppSelector';
import { prefetchContent } from 'common/hooks/useContent/prefetchUtils';
import { getCachedVideoData } from 'common/hooks/useContent/queryFunctions';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { preferredLocaleSelector } from 'common/selectors/ui';
import type { FetchDataParams } from 'common/types/container';
import type { TubiContainerFC } from 'common/types/tubiFC';
import Footer from 'web/components/Footer/Footer';
import { WebRefreshConsumer } from 'web/context/webRefreshContext';
import WebFoxLivePlayer from 'web/features/liveEvent/components/WebFoxLivePlayer/WebFoxLivePlayer';
import { NFL_CONTENT_ID, TIKTOK_AWARDS_CONTENT_ID } from 'web/features/liveEvent/constants';
import { useElementInViewport } from 'web/features/liveEvent/hooks/useElementInViewport';
import { useRelatedExpand } from 'web/features/liveEvent/hooks/useRelatedExpand';
import NFLSchema from 'web/features/seo/components/NFLSchema/NFLSchema';
import { getVideoMetaForSEO } from 'web/features/seo/utils/getVideoMetaForSEO';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import RelatedContents from 'web/rd/components/RelatedContents/RelatedContents';

import styles from './LiveEventDetails.scss';
import AboutEvent from '../../components/AboutEvent';
import AboutTubi from '../../components/AboutTubi';
import FAQ from '../../components/FAQ';
import { LiveEventTopDetails } from '../../components/LiveEventTopDetails/LiveEventTopDetails';
import messages from '../../messages';
import { enabledLiveEventPlayerSelector } from '../../selectors';

const columnBreakpoints = {
  xs: '4',
  lg: '3',
};

export type RouteParams = {
  id: string;
};

export const LiveEventDetailsContent: React.FC<{ id: string, showFooter?: boolean }> = ({ id, showFooter = false }) => {
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const video = useAppSelector((state) => state.video.byId[id]);
  const liveEvent = useLiveEvent(id);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const relatedContainerRef = useRef<HTMLDivElement>(null);
  const aboutTubiRef = useRef<HTMLDivElement>(null);
  // Calculate derived state values
  const { status } = liveEvent || {};
  const enabledLiveEventPlayer = useAppSelector(state => enabledLiveEventPlayerSelector(state, { video }));
  const shouldShowPlayer = liveEvent
    && status === LiveEventContentStatus.Live
    && enabledLiveEventPlayer
    && video.player_type === 'fox';
  const shouldShowNFLDetails = id === NFL_CONTENT_ID;

  const isPlayerInViewport = useElementInViewport(playerContainerRef, {
    threshold: 0.1,
    rootMargin: '0px 0px 0px 0px',
    dependencies: [shouldShowPlayer],
  });
  const isAboutTubiInViewport = useElementInViewport(aboutTubiRef, {
    threshold: 0.1, // AboutTubi is considered in view when 10% is visible
    rootMargin: '0px',
  });
  const shouldShowStickyRelated = shouldShowNFLDetails && (!shouldShowPlayer || !isPlayerInViewport);

  // Use the custom hook for related content expansion logic
  const {
    isRelatedExpanded,
    handleRelatedExpandToggle,
    handleRelatedMouseEnter,
    handleRelatedMouseLeave,
  } = useRelatedExpand({
    enableCollapse: shouldShowNFLDetails,
    shouldShowStickyRelated,
    isBottomElementInViewport: isAboutTubiInViewport,
    relatedContainerRef,
  });

  if (!liveEvent) {
    return null;
  }

  return (
    <div>
      <div className={classnames(styles.container, {
        [styles.withNFLDetails]: shouldShowNFLDetails,
      })}
      >
        {shouldShowPlayer && (
          <div ref={playerContainerRef}>
            <WebFoxLivePlayer contentId={id} />
          </div>
        )}
        <LiveEventTopDetails id={id} type="fullscreen" hasPlayer={shouldShowPlayer} />
        {shouldShowNFLDetails ? (
          <>
            <NFLSchema />
            <AboutEvent />
            <FAQ />
          </>
        ) : null}
        <div
          ref={relatedContainerRef}
          className={classnames(styles.related, {
            [styles.stickyRelatedRow]: shouldShowStickyRelated,
            [styles.expanded]: isRelatedExpanded,
          })}
        >
          <RelatedContents
            breakpoints={columnBreakpoints}
            contentId={id}
            showOneRow
            // CONTAINER_ID_FOR_RELATED_RANKING is the backup row for the case that the live event is not available in the related contents
            rowIds={[CONTAINER_ID_FOR_LIVE_EVENT_RELATED, CONTAINER_ID_FOR_RELATED_RANKING]}
            limit={RELATED_CONTENTS_LIMIT_LEGACY}
            isVertical={false}
            isContentUnavailable={false}
            isMobileRedesign={false}
            hideMetadata
            mouseEventsOnContentOnly
            onTouchEnd={isMobile ? handleRelatedExpandToggle : undefined}
            onMouseEnter={isMobile ? undefined : handleRelatedMouseEnter}
            onMouseLeave={isMobile ? undefined : handleRelatedMouseLeave}
          />
        </div>

        {shouldShowNFLDetails ? (
          <AboutTubi forwardedRef={aboutTubiRef} />
        ) : null}
      </div>
      {
        showFooter ? (
          <WebRefreshConsumer>{({ enabled }) => <Footer contentId={id} useRefreshStyle={enabled} />}</WebRefreshConsumer>
        ) : null
      }
    </div>
  );
};

const getDefaultContentIdfromURL = (pathname: string) => {
  if (pathname === WEB_ROUTES.tiktokawards) {
    return TIKTOK_AWARDS_CONTENT_ID;
  }
  return NFL_CONTENT_ID;
};

export const LiveEventDetails: TubiContainerFC<{}, RouteParams> = (props) => {
  const { params, location } = props;
  const pathname = location.pathname;
  const id = params.id || getDefaultContentIdfromURL(pathname);
  const video = useAppSelector((state) => state.video.byId[id]);
  const deviceId = useAppSelector(deviceIdSelector);
  const preferredLocale = useAppSelector(preferredLocaleSelector);
  const intl = useIntl();
  const helmetProps = useMemo(() => {
    if (pathname === WEB_ROUTES.tiktokawards) {
      return getVideoMetaForSEO({ video, deviceId, preferredLocale });
    }
    const metaTitle = intl.formatMessage(messages.nflTitle);
    const metaDescription = intl.formatMessage(messages.nflDescription);
    const canonical = getCanonicalLink(WEB_ROUTES.nfl);

    return {
      title: metaTitle,
      link: [
        getCanonicalMetaByLink(canonical),
      ],
      meta: [
        { name: 'description', content: metaDescription },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: metaTitle },
        { property: 'og:description', content: metaDescription },
        { property: 'twitter:title', content: metaTitle },
        { property: 'twitter:description', content: metaDescription },
      ],
    };
  }, [intl, video, deviceId, preferredLocale, pathname]);

  return (<React.Fragment>
    <Helmet {...helmetProps} />
    <LiveEventDetailsContent id={id} showFooter />
  </React.Fragment>);
};

LiveEventDetails.fetchData = ({ getState, dispatch, params = {}, queryClient, location }: FetchDataParams<Record<string, any>>) => {
  let { id: targetId } = params as { id?: string };
  if (!targetId) {
    targetId = getDefaultContentIdfromURL(location.pathname);
  }
  const state = getState();

  const promises = [];
  const cachedVideo = getCachedVideoData({ queryClient, contentId: targetId, state });
  if (!cachedVideo) {
    promises.push(prefetchContent(queryClient, targetId, {}, dispatch, getState));
  }

  return Promise.all(promises);
};
LiveEventDetails.hasDynamicMeta = true;

export default LiveEventDetails;
