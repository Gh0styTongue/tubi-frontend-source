import { isChromeOnAndroidMobile } from '@adrise/utils/lib/ua-sniffing';
import { toCSSUrl } from '@adrise/utils/lib/url';
import { Col } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { trackMobileWebDeeplink } from 'client/features/playback/track/client-log/trackMobileWebDeeplink';
import PlayButtonEmpty from 'common/components/uilib/PlayButtonEmpty/PlayButtonEmpty';
import WebAndroidDisablePlayback from 'common/experiments/config/webAndroidDisablePlayback';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { userAgentSelector } from 'common/selectors/ui';
import { isWebLinearPlaybackSupportedSelector } from 'common/selectors/webLive';
import type StoreState from 'common/types/storeState';
import redirect from 'common/utils/redirect';
import { getDeepLinkForVideo, getUrlByVideo } from 'common/utils/urlConstruction';

import styles from './LiveNewsTile.scss';

export interface LiveNewsTileProps extends ReturnType<typeof mapStateToProps>{
  id: string;
  className?: string,
  xs?: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string,
  xxl?: string,
  trackCb: (index: number, id: string) => void;
  hideTitle?: boolean;
  showPlayButton?: boolean;
}

export const LiveNewsTile: FC<LiveNewsTileProps> = (props) => {
  const {
    className,
    content,
    trackCb,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    isMobile,
    isLinearPlaybackSupported,
    hideTitle,
    showPlayButton,
    deviceId,
  } = props;
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const webAndroidDisablePlayback = useExperiment(WebAndroidDisablePlayback);
  const userAgent = useAppSelector(userAgentSelector);

  useEffect(() => {
    if (userAgent && isChromeOnAndroidMobile(userAgent)) {
      webAndroidDisablePlayback.logExposure();
    }
  }, [userAgent, webAndroidDisablePlayback]);

  if (!content) return null;

  const { landscape_images = [], title } = content;
  const tileSize = { xs, sm, md, lg, xl, xxl };
  const bg = {
    backgroundImage: toCSSUrl(landscape_images[0]),
  };
  const hostClassName = classNames(styles.tile, className);
  const titleUrl = getUrlByVideo({ video: content });

  const goToPlayer = () => {
    if (!isLinearPlaybackSupported) {
      trackMobileWebDeeplink({ deeplinkSource: 'LiveNewsTile' as const });
      redirect(getDeepLinkForVideo(content, deviceId, {
        stopTracking: !isThirdPartySDKTrackingEnabled,
      }));
      return;
    }
    tubiHistory.push(titleUrl);
    if (trackCb) {
      trackCb(0, content.id);
    }
  };

  const headContent = (
    <div className={styles.head} style={bg}>
      <div className={styles.overlay} />
      <div
        onClick={isMobile ? undefined : goToPlayer}
        onTouchEnd={isMobile ? goToPlayer : undefined}
        className={classNames(
          styles.playWrapper,
          showPlayButton ? styles.showPlayButton : null,
        )}
      >
        <PlayButtonEmpty className={styles.play} />
      </div>
    </div>
  );

  const linkContent = (
    <div onClick={goToPlayer} className={styles.title}>{title}</div>
  );

  return (
    <Col {...tileSize} className={hostClassName}>
      {headContent}
      {!hideTitle ? linkContent : null}
    </Col>
  );
};

function mapStateToProps(state: StoreState, { id }: { id: string}) {
  const { video, ui, auth: { deviceId } } = state;

  return {
    content: video.byId[id],
    isMobile: ui.isMobile,
    isLinearPlaybackSupported: isWebLinearPlaybackSupportedSelector(state),
    deviceId,
  };
}

export default connect(mapStateToProps)(LiveNewsTile);
