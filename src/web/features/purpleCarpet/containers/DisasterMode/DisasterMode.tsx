import { isInProgress } from '@adrise/utils/lib/time';
import { toCSSUrl } from '@adrise/utils/lib/url';
import { Live24, Subtitles } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { defineMessages } from 'react-intl';

import TileBadge from 'common/components/TileBadge/TileBadge';
import { LINEAR_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE } from 'common/constants/constants';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { loadListing } from 'common/features/purpleCarpet/action';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import type { TubiContainerFC } from 'common/types/tubiFC';
import type { Video } from 'common/types/video';
import redirect from 'common/utils/redirect';
import { getDeepLinkForVideo, getUrl } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import Footer from 'web/components/Footer/Footer';

import styles from './DisasterMode.scss';

const messages = defineMessages({
  watchLive: {
    defaultMessage: 'Watch Live',
    description: 'Watch Live button',
  },
  watchLiveInApp: {
    description: 'Watch Live in the App',
    defaultMessage: 'Watch Live in the App',
  },
});

const DisasterMode: TubiContainerFC = () => {
  const intl = useIntl();
  const listing = useAppSelector((state) => state.purpleCarpet.listing);
  const mainEvent = listing.find(item => !!item.main_event);
  const currentEvent = mainEvent || listing.find(item => item.network !== 'foxdep' && isInProgress(item.startDate, item.endDate));
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const deviceId = useAppSelector(state => state.auth.deviceId);

  const buttonProps = {
    appearance: 'primary' as const,
    children: isMobile ? intl.formatMessage(messages.watchLiveInApp) : intl.formatMessage(messages.watchLive),
    icon: Live24,
    iconSize: 'large' as const,
    tag: undefined,
    onClick: useCallback(() => {
      /* istanbul ignore next */
      if (!currentEvent) return;
      if (isMobile) {
        redirect(getDeepLinkForVideo(
          {
            id: currentEvent.tubi_id,
            type: SPORTS_EVENT_CONTENT_TYPE,
          } as Video,
          deviceId,
          {
            stopTracking: !isThirdPartySDKTrackingEnabled,
          })
        );
      } else {
        tubiHistory.push(getUrl({
          id: currentEvent.tubi_id,
          type: LINEAR_CONTENT_TYPE,
        }));
      }
    }, [isMobile, currentEvent, deviceId, isThirdPartySDKTrackingEnabled]),
  };

  if (!currentEvent) {
    return null;
  }
  const bg = isMobile && currentEvent.heroImage ? currentEvent.heroImage : currentEvent.background;

  return (
    <div>
      <div className={styles.container}>
        <div
          className={styles.backgroundBg}
          style={{
            backgroundImage: toCSSUrl(bg),
          }}
        />
        <div className={styles.content}>
          <TileBadge type="live" />
          <img className={styles.title} alt="title" src={currentEvent.logo} />

          <div className={styles.genres}>
            {currentEvent.genres?.length ? <span>{currentEvent.genres[0]}</span> : null}
            <Subtitles />
          </div>

          { !isMobile ? <div className={styles.description}>{currentEvent.description}</div> : null }

          <Button
            // eslint-disable-next-line react/forbid-component-props
            className={styles.button}
            {...buttonProps}
          />

          { isMobile ? <div className={styles.description}>{currentEvent.description}</div> : null }
        </div>
      </div>
      <Footer />
    </div>
  );
};

DisasterMode.fetchData = async ({ dispatch }) => {
  await dispatch(loadListing(true));
};
DisasterMode.hasDynamicMeta = true;

export default DisasterMode;
