import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { AlertFilled24 } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { BANNER_CONTAINER_ID, VIEWPORT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { mainGameSelector } from 'common/features/purpleCarpet/selector';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { majorEventNameSelector } from 'common/selectors/remoteConfig';
import { viewportTypeSelector } from 'common/selectors/ui';
import trackingManager from 'common/services/TrackingManager';
import { getUrl } from 'common/utils/urlConstruction';
import { matchesRoute } from 'common/utils/urlPredicates';

import messages from './messages';
import styles from './PurpleCarpetBanner.scss';
import { PurpleCarpeBannerPosition, PurpleCarpeBannerType } from './purpleCarpetBannerSelector';

const BANNER_SMALL_BG = 'https://mcdn.tubitv.com/image/sealion/banner/small_background.png';
const BANNER_LARGE_BG = 'https://mcdn.tubitv.com/image/sealion/banner/large_background.png';
const SUPPORTED_DEVICE_LINK = 'https://tubitv.com/help-center/Content/articles/30350383354651';

const ComingSoonBanner = ({ id, position }: { id: string; position: PurpleCarpeBannerPosition }) => {
  const content = useAppSelector((state) => state.video.byId[id]);
  const intl = useIntl();
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const viewportType = useAppSelector(viewportTypeSelector);
  const isMobile = viewportType === VIEWPORT_TYPE.mobile;
  const { pathname } = useLocation();

  const onClick = useCallback(() => {
    if (!content) return;
    if (matchesRoute(WEB_ROUTES.movieDetail, pathname)) return;

    trackingManager.createNavigateToPageComponent({
      startX: 0,
      startY: 0,
      containerSlug: BANNER_CONTAINER_ID,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
    const url = getUrl({
      id: content.id,
      title: content.title,
      type: content.type,
    });
    tubiHistory.push(url);
  }, [content, pathname]);

  if (!content) return null;

  const logoImage = content.banner_images?.title;
  const logo = logoImage ? <img src={logoImage} className={styles.logo} alt="banner logo" fetchPriority="high" /> : null;
  const date = intl.formatDate(content.air_datetime, {
    month: 'short',
    day: 'numeric',
  });
  const bannerText = content?.banner_texts;
  let text = isLoggedIn ? bannerText?.banner_text_registered : bannerText?.banner_text_guest;
  text = text?.replace('{date}', date);
  const subText = isLoggedIn ? undefined : bannerText?.banner_text_disclaimer_guest;
  const rightLogo = !isLoggedIn && content.banner_images?.disclaimer_logo ? <img src={content.banner_images.disclaimer_logo} className={styles.rightLogo} alt="disclaimer logo" fetchPriority="high" /> : null;
  const bg = isMobile
    ? content.banner_images?.small_background ? content.banner_images.small_background : BANNER_SMALL_BG
    : content.banner_images?.large_background ? content.banner_images.large_background : BANNER_LARGE_BG;

  return (
    <div
      className={
        classnames(
          styles.banner,
          styles.clickable,
          {
            [styles.bottomBanner]: position === PurpleCarpeBannerPosition.BOTTOM,
            [styles.vertical]: !isLoggedIn && isMobile,
          }
        )
      }
      style={{ backgroundImage: `url(${bg})` }}
      onClick={onClick}
    >
      {logo}
      <div className={styles.text}>
        {text}
        {subText ? <div className={styles.subText}>{subText}</div> : null}
      </div>
      {rightLogo}
    </div>
  );
};

const SupportedAppsBanner = ({ position }: { position: PurpleCarpeBannerPosition }) => {
  const { formatMessage } = useIntl();
  const viewportType = useAppSelector(viewportTypeSelector);
  const isMobile = viewportType === VIEWPORT_TYPE.mobile;
  const bg = isMobile ? BANNER_SMALL_BG : BANNER_LARGE_BG;

  return (
    <div
      className={
        classnames(styles.banner,
          {
            [styles.bottomBanner]: position === PurpleCarpeBannerPosition.BOTTOM,
            [styles.bottomSupportedAppBanner]: position === PurpleCarpeBannerPosition.BOTTOM,
          }
        )
      }
      style={{
        backgroundImage: `url(${bg})` }}
    >
      <div className={styles.text}>
        {formatMessage(messages.watchOnTubiAppText)}
      </div>
      <Button
        // eslint-disable-next-line react/forbid-component-props
        className={styles.button}
        appearance="tertiary"
        size="small"
        onClick={() => tubiHistory.push(SUPPORTED_DEVICE_LINK)}
      >{formatMessage(messages.viewSupportedDevicesText)}</Button>
    </div>
  );
};

const DisasterModeBanner = ({ position }: { position: PurpleCarpeBannerPosition }) => {
  const { formatMessage } = useIntl();
  const majorEventName = useAppSelector(majorEventNameSelector) || formatMessage(messages.fallbackEventName);

  return (
    <div
      className={
        classnames(
          styles.banner,
          styles.bannerBg,
          {
            [styles.bottomBanner]: position === PurpleCarpeBannerPosition.BOTTOM,
          }
        )
      }
    >
      <AlertFilled24 />
      <div className={styles.text}>
        {formatMessage(messages.disasterTip, { name: majorEventName })}
      </div>
    </div>
  );
};

const PurpleCarpetBanner = ({ position, type }: {position: PurpleCarpeBannerPosition, type: PurpleCarpeBannerType}) => {
  const mainGameId = useAppSelector(mainGameSelector);
  if (type === PurpleCarpeBannerType.DISASTER) {
    return <DisasterModeBanner position={position} />;
  }
  if (!mainGameId) return null;

  if (type === PurpleCarpeBannerType.COMING_SOON && mainGameId) {
    return <ComingSoonBanner id={mainGameId} position={position} />;
  }
  if (type === PurpleCarpeBannerType.WATCH_ON_APP) {
    return <SupportedAppsBanner position={position} />;
  }

  return null;
};

export default PurpleCarpetBanner;
