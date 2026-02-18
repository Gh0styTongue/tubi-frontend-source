import { toCSSUrl } from '@adrise/utils/lib/url';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { LiveFilled24, Subtitles } from '@tubitv/icons';
import { Container, Label } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import { setTopNavVisibleState } from 'common/actions/ui';
import LinearProgramTimeRemaining from 'common/components/LinearProgramTimeRemaining/LinearTimeProgramRemaining';
import { RatingWithDescriptor } from 'common/components/VideoComponents/VideoComponents';
import * as actions from 'common/constants/action-types';
import { CONTAINER_TYPES, LIVE_NEWS_CONTAINER_ID } from 'common/constants/constants';
import { setLiveVideoPlayer } from 'common/features/playback/actions/live';
import { actionWrapper } from 'common/utils/action';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import { getContainerUrl } from 'common/utils/urlConstruction';
import type { EPGProps } from 'web/components/EPG/EPG';
import EPGComponent from 'web/components/EPG/EPG';
import Footer from 'web/components/Footer/Footer';
import WebLivePlayer from 'web/features/playback/components/WebLivePlayer/WebLivePlayer';
import { getCanonicalLink, getCanonicalMetaByLink } from 'web/features/seo/utils/seo';
import { useEpgActiveChannelAndProgram } from 'web/hooks/useEPG';

import styles from './EPG.scss';

export const messages = defineMessages({
  timeLeft: {
    description: 'The remaining time of the program, for example "1h 3m left"',
    defaultMessage: '{time} left',
  },
  liveLabel: {
    description: 'live content label',
    defaultMessage: 'Live',
  },
  metaDescription: {
    description: 'Description for EPG page',
    defaultMessage:
      'Watch Free Live TV on any device. Tubi offers streaming live news, sports, business, weather, and entertainment you will love.',
  },
  metaTitle: {
    description: 'Title for EPG page',
    defaultMessage: 'Watch Free Live TV, Movies and TV Shows Online | Tubi',
  },
  pageTitle: {
    description: 'Shared EPG page title',
    defaultMessage: 'Live TV',
  },
});

const EPG = ({ mode, location }: EPGProps) => {
  const dispatch = useDispatch();
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  const topSectionRef = useRef<HTMLDivElement>(null);

  // Always keep top nav visible following the design
  useEffect(() => {
    dispatch(actionWrapper(actions.SET_TOGGLE_TOP_NAV_ON_SCROLL, { toggleTopNavOnScroll: false }));
    dispatch(setTopNavVisibleState(true));
    return () => {
      dispatch(actionWrapper(actions.SET_TOGGLE_TOP_NAV_ON_SCROLL, { toggleTopNavOnScroll: true }));
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      setLiveVideoPlayer(showMiniPlayer ? PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE : PlayerDisplayMode.BANNER)
    );
  }, [dispatch, showMiniPlayer]);

  // Switch top player to mini player when the top section has an intersection with the top viewport
  useEffect(() => {
    const threshold = 0.7;
    const options = {
      root: null,
      rootMargin: '0px',
      threshold,
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setShowMiniPlayer(entry.intersectionRatio < threshold);
      });
    }, options);
    if (topSectionRef.current) {
      observer.observe(topSectionRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  const { formatMessage } = useIntl();
  const meta = useMemo(() => {
    const description = formatMessage(messages.metaDescription);
    const canonical = getCanonicalLink(getContainerUrl(LIVE_NEWS_CONTAINER_ID, { type: CONTAINER_TYPES.LINEAR }));
    const title = formatMessage(messages.pageTitle);
    return {
      title: formatMessage(messages.metaTitle),
      description,
      link: [getCanonicalMetaByLink(canonical)],
      meta: [
        { name: 'keywords', content: 'Live News, Free Live News, HD Live News' },
        { name: 'description', content: description },
        { property: 'og:url', content: canonical },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'twitter:title', content: title },
        { property: 'twitter:description', content: description },
      ],
    };
  }, [formatMessage]);

  const { activeChannelId, activeChannel, activeProgram } = useEpgActiveChannelAndProgram();
  const programDetails = activeProgram || activeChannel;
  const timeRemaining = activeProgram ? (
    <LinearProgramTimeRemaining activeProgram={activeProgram}>
      {(duration) => (
        <div className={styles.timeLeft}>
          <FormattedMessage {...messages.timeLeft} values={{ time: duration }} />
        </div>
      )}
    </LinearProgramTimeRemaining>
  ) : null;

  const { query = {} } = location || {};
  const isDeeplink = isDeepLinkOnWeb(query);

  return (
    <div className={styles.epg}>
      <Helmet {...meta} />
      {activeChannel?.images ? (
        <div
          className={styles.backgroundImage}
          style={{
            backgroundImage: `${toCSSUrl(activeChannel.images.landscape[0])}`,
          }}
        />
      ) : null}
      <Container className={classNames(styles.container)}>
        <div className={classNames(styles.topSection)} ref={topSectionRef}>
          {programDetails ? (
            <div className={styles.topSectionTitleArea}>
              <Label className={styles.liveLabel} icon={<LiveFilled24 />} color="red">
                <FormattedMessage {...messages.liveLabel} />
              </Label>
              <div className={styles.title}>{programDetails?.title}</div>
              <div className={styles.info}>
                {timeRemaining}
                {
                  // This should be change to activeProgram once backend sends CC data for programs
                  activeChannel?.has_subtitle && (
                    <div>
                      <Subtitles className={styles.closedCaptions} />
                    </div>
                  )
                }
                <div className={styles.ratingsContainer}>
                  <RatingWithDescriptor
                    rating={programDetails?.ratings}
                    cls={styles.ratingsBadge}
                    overrideDescriptorClass={styles.ratingsDescriptor}
                  />
                </div>
              </div>
              <div className={styles.description}>{programDetails?.description}</div>
            </div>
          ) : null}
          <div className={showMiniPlayer ? styles.miniPlayer : styles.topPlayer}>
            <WebLivePlayer
              contentId={activeChannelId}
              playerView={showMiniPlayer ? 'mini' : 'topPage'}
              isDeeplink={isDeeplink}
            />
          </div>
        </div>
        <div className={styles.epgSection}>
          <EPGComponent mode={mode} />
        </div>
      </Container>
      <Footer useRefreshStyle />
    </div>
  );
};

export default EPG;
