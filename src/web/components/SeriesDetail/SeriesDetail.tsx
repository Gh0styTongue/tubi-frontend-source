import { isEmptyObject } from '@adrise/utils/lib/size';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import classNames from 'classnames';
import throttle from 'lodash/throttle';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import { AUTO_START_CONTENT, BREAKPOINTS } from 'common/constants/constants';
import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import tubiHistory from 'common/history';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { isInWebMobileDetailsRedesignSelector } from 'common/selectors/experiments/webMobileDetailsRedesign';
import { uiSelector } from 'common/selectors/ui';
import trackingManager from 'common/services/TrackingManager';
import type { History, HistoryEpisode } from 'common/types/history';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { getUrlByVideo, getDeepLinkForVideo } from 'common/utils/urlConstruction';
import { addLocalePrefix } from 'common/utils/urlManipulation';
import type { LocaleOptionType } from 'i18n/constants';
import RefreshBackgroundImage from 'web/rd/components/BackgroundImage/BackgroundImage';
import ContentDetail from 'web/rd/components/ContentDetail/ContentDetail';

import styles from './SeriesDetail.scss';

export interface LatestEpisodeInfo extends HistoryEpisode, Video {
  series_id?: string;
}

type OwnProps = {
  dispatch: TubiThunkDispatch;
  history?: History;
  latestEpisodeInfo: LatestEpisodeInfo;
  isMobile?: boolean;
  isThirdPartySDKTrackingEnabled: boolean;
  series: Video;
  isKidsModeEnabled?: boolean;
  isContentUnavailable: boolean;
  isContentComingSoon: boolean;
  seasonIndex?: number;
  onSeasonIndexChange?: (index: number) => void;
  isMobileRedesign?: boolean;
};

type StateProps = {
  deviceId: string | undefined;
  isMatureContentGated: boolean;
  preferredLocale?: LocaleOptionType;
};

type SeriesDetailProps = OwnProps & StateProps & WithRouterProps;

interface SeriesDetailState {
  vw: number;
}

export class SeriesDetail extends Component<SeriesDetailProps, SeriesDetailState> {
  constructor(props: SeriesDetailProps) {
    super(props);

    this.state = {
      vw: this.props.isMobile ? BREAKPOINTS.sm : BREAKPOINTS.xl,
    };

    this.handleResize = throttle(this.handleResize, 250);
  }

  componentDidMount() {
    addEventListener(window, 'resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    removeEventListener(window, 'resize', this.handleResize);
  }

  handleResize = () => {
    const vw = window.innerWidth;
    this.setState({ vw });
  };

  handleWatch = () => {
    const {
      history,
      latestEpisodeInfo,
      isMobile,
      isThirdPartySDKTrackingEnabled,
      deviceId,
      preferredLocale,
    } = this.props;

    if (isMobile) {
      window.location.href = getDeepLinkForVideo(latestEpisodeInfo, deviceId, {
        stopTracking: !isThirdPartySDKTrackingEnabled,
      });
      return;
    }

    const url = addLocalePrefix(preferredLocale, getUrlByVideo({ video: latestEpisodeInfo }));

    trackingManager.createNavigateToPageComponent({
      componentType: ANALYTICS_COMPONENTS.middleNavComponent,
      endY: isEmptyObject(history ?? {})
        ? ContentDetailPageNavOption.Play
        : ContentDetailPageNavOption.ContinueWatching,
    });

    tubiHistory.push({
      pathname: url,
      state: {
        [AUTO_START_CONTENT]: true,
      },
    });
  };

  render() {
    const {
      series,
      latestEpisodeInfo,
      isContentUnavailable,
      seasonIndex,
      onSeasonIndexChange,
      isMatureContentGated,
      isMobileRedesign,
    } = this.props;

    const { backgrounds = [], hero_images: heroImages = [], posterarts: posters = [], images = {} } = series;

    const topImage = backgrounds[0] || heroImages[0] || posters[0];
    const mobileBackground = images.hero_422 && images.hero_422[0];

    const posterUrl = posters[0];

    return (
      <div className={styles.series}>
        <RefreshBackgroundImage
          preload
          src={topImage}
          srcMobile={mobileBackground}
          isMobileRedesign={isMobileRedesign}
          content={series}
        />
        <div className={classNames(styles.positionContentDetail, {
          [styles.mobileRedesign]: isMobileRedesign,
        })}
        >
          <ContentDetail
            belongSeries={series.id}
            content={series}
            onClickWatch={latestEpisodeInfo ? this.handleWatch : null}
            posterUrl={posterUrl}
            seasons={series.seasons}
            isSeriesDetail
            shouldShowContentUnavailable={isContentUnavailable}
            showRemindMe={isContentUnavailable}
            seasonIndex={seasonIndex}
            onSeasonIndexChange={onSeasonIndexChange}
            isMatureContentGated={isMatureContentGated}
            relatedContentsHeadingLevel="h3"
            isMobileRedesign={isMobileRedesign}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, ownProps: OwnProps) => {
  return {
    deviceId: deviceIdSelector(state),
    isMatureContentGated: isMatureContentGatedSelector(state, ownProps.series),
    preferredLocale: uiSelector(state).preferredLocale,
    isMobileRedesign: isInWebMobileDetailsRedesignSelector(state),
  };
};

export default connect(mapStateToProps)(
  withRouter(
    SeriesDetail
  )
);
