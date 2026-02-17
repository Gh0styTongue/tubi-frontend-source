import { AutoPlayAction } from '@tubitv/analytics/lib/autoplayTypes';
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { loadAutoPlayContents } from 'common/actions/video';
import ArrowDownCircleIcon from 'common/components/uilib/SvgLibrary/ArrowDownCircleIcon';
import { SERIES_CONTENT_TYPE } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { isInGDPRCountryWithKidsSelector } from 'common/features/gdpr/selectors/gdpr';
import tubiHistory from 'common/history';
import { autoPlayContentsSelector } from 'common/selectors/video';
import trackingManager from 'common/services/TrackingManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { buildAutoPlayEventBody } from 'common/utils/analytics';
import { getAutoPlayContentId, getAutoPlayCounter, getAutoPlayUrl } from 'common/utils/autoplay';
import { trackEvent } from 'common/utils/track';
import AutoPlayContents from 'web/features/playback/components/AutoPlay/AutoPlayContents/AutoPlayContents';
import AutoPlayMinimizedDetail from 'web/features/playback/components/AutoPlay/AutoPlayMinimizedDetail/AutoPlayMinimizedDetail';

import styles from './AutoPlay.scss';

const messages = defineMessages({
  hideAutoplay: {
    description: 'hide autoplay',
    defaultMessage: 'Hide',
  },
  openAutoplay: {
    description: 'open autoplay',
    defaultMessage: 'Open',
  },
});

export type AutoPlayProps = WithRouterProps & {
  contents: ReturnType<typeof autoPlayContentsSelector>,
  byId: { [id: string]: Video},
  dispatch: TubiThunkDispatch,
  id: string,
  isEpisode: boolean,
  videoPaused: boolean,
  isFromAutoplay: boolean,
  isCounterEnabled: boolean,
  className?: string,
  onAutoplay?: (
    options: {
      contentId: string,
      isFromAutoplayDeliberate: boolean,
      isFromAutoplayAutomatic: boolean,
      isLive?: boolean
  }) => void,
  onAutoplayContentLoaded?: (contents: ReturnType<typeof autoPlayContentsSelector>, timeLeft: number) => void,
  onPause?: () => void,
  onResume?: () => void;
  contentLimit?: number,
  compactAutoplayUiMode: boolean,
};

interface AutoPlayState {
  timeLeft?: ReturnType<typeof getAutoPlayCounter>,
  activeIndex: number,
  minimized: boolean,
}

/**
 * Handle logic surrounding autoplay
 * Pass most UI concerns to AutoPlayContents
 */
export class AutoPlay extends PureComponent<AutoPlayProps, AutoPlayState> {
  private counterTimer: ReturnType<typeof setInterval> | null = null;

  constructor(props: AutoPlayProps) {
    super(props);
    const { isEpisode, isCounterEnabled } = props;
    this.state = {
      timeLeft: isCounterEnabled ? getAutoPlayCounter(isEpisode) : undefined,
      activeIndex: 0,
      minimized: false,
    };
  }

  componentDidMount() {
    const { dispatch, id, isEpisode, isFromAutoplay, contentLimit } = this.props;

    trackEvent(eventTypes.AUTO_PLAY, buildAutoPlayEventBody(id, AutoPlayAction.SHOW));
    const defaultLimit = isEpisode ? 1 : 5;
    // Always load fresh contents
    dispatch(
      loadAutoPlayContents(id, {
        isAutoPlayVideo: isFromAutoplay,
        includeVideoResourceTag: true,
        limit: contentLimit ?? defaultLimit,
      }),
    ).then(() => {
      if (this.props.contents.length === 0) return;
      if (this.props.onAutoplayContentLoaded && this.state.timeLeft) {
        this.props.onAutoplayContentLoaded(this.props.contents, this.state.timeLeft);
      }
      this.handleMountWithContents();
    });
  }

  componentWillUnmount() {
    this.clearCounterTimer();
  }

  componentDidUpdate(prevProps: Readonly<AutoPlayProps>, prevState: Readonly<AutoPlayState>,) {
    const isCurrentPaused = this.state.minimized || this.props.videoPaused;
    const isPreviousPaused = prevState.minimized || prevProps.videoPaused;
    if (isCurrentPaused !== isPreviousPaused) {
      if (isCurrentPaused && this.props.onPause) {
        this.props.onPause();
      }
      if (!isCurrentPaused && this.props.onResume) {
        this.props.onResume();
      }
    }
  }

  /**
   * Do not propagate to parent PlayerOverlay & PlayerArea
   */
  stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  timeHandler = () => {
    if (this.state.timeLeft === undefined || this.props.videoPaused || this.state.minimized) return;
    const { timeLeft } = this.state;
    if (timeLeft <= 0) {
      // Set autoplay deliberate to false
      trackingManager.setAutoplayDeliberate(false);
      this.clearCounterTimer();
      this.autoPlay();
      return;
    }
    this.setState({ timeLeft: this.state.timeLeft - 1 });
  };

  handleMountWithContents() {
    if (this.props.isCounterEnabled) {
      this.counterTimer = setInterval(this.timeHandler, 1000);
    }
  }

  changeActiveIndex = (index: number) => {
    const { activeIndex } = this.state;
    if (activeIndex === index) return;
    this.setState({
      activeIndex: index,
      timeLeft: getAutoPlayCounter(this.props.isEpisode),
    });
  };

  clearCounterTimer() {
    if (this.counterTimer) clearInterval(this.counterTimer);
  }

  getAutoPlayVideo = () => {
    const { contents, byId } = this.props;
    const activeVideo = contents[this.state.activeIndex];
    const autoPlayContentId = getAutoPlayContentId(activeVideo);
    return byId[autoPlayContentId] || activeVideo;
  };

  autoPlay = (isFromAutoplayDeliberate: boolean = false) => {
    const { onAutoplay } = this.props;
    const autoPlayVideo = this.getAutoPlayVideo();
    const toUrl = getAutoPlayUrl(autoPlayVideo);
    tubiHistory.push(toUrl);
    if (onAutoplay) {
      onAutoplay({
        contentId: autoPlayVideo.id,
        isFromAutoplayDeliberate,
        isFromAutoplayAutomatic: !isFromAutoplayDeliberate,
      });
    }
  };

  /**
   * Navigate to the autoplay title, but register that an active user
   * interaction took us there.
   */
  manualAutoPlay() {
    const { type, id } = this.getAutoPlayVideo();
    trackingManager.createNavigateToPageComponent({
      startX: this.state.activeIndex,
      startY: 0,
      contentId: type === SERIES_CONTENT_TYPE ? `0${id}` : id,
      componentType: ANALYTICS_COMPONENTS.autoplayComponent,
    });
    trackingManager.setAutoplayDeliberate(true);
    this.autoPlay(true);
  }

  toggle = () => this.setState({ minimized: !this.state.minimized });

  onTileClick = (index: number) => {
    if (index === this.state.activeIndex) {
      this.manualAutoPlay();
    } else {
      const activeIdx = this.state.activeIndex;
      const { contents } = this.props;
      const { id } = contents[activeIdx];
      // Track navigate within page event for Auto play component
      trackingManager.trackCarouselTrigger({
        startX: activeIdx,
        endX: index,
        contentId: id,
        slug: '',
        componentType: ANALYTICS_COMPONENTS.autoplayComponent,
      });
      this.changeActiveIndex(index);
    }
  };

  onLinkClick = () => {
    this.manualAutoPlay();
  };

  render() {
    const { contents, isEpisode, className, compactAutoplayUiMode } = this.props;
    if (contents.length === 0) return null;
    const { minimized, activeIndex, timeLeft } = this.state;
    const activeVideo = contents[activeIndex];
    const toUrl = getAutoPlayUrl(activeVideo);
    const triggerIconCls = classNames(styles.triggerIcon, {
      [styles.open]: minimized,
    });
    const triggerText = minimized ? messages.openAutoplay : messages.hideAutoplay;
    return (
      <div
        className={classNames(styles.autoplayWrapper, className)}
        onClick={this.stopPropagation}
      >
        <div className={styles.gradient} />
        <div className={classNames(styles.row, compactAutoplayUiMode && styles.compact)}>
          {!compactAutoplayUiMode && <div className={styles.triggerRow} onClick={this.toggle}>
            <ArrowDownCircleIcon className={triggerIconCls} />
            <div className={styles.trigger}>
              <FormattedMessage {...triggerText} />
            </div>
          </div>}
          {minimized || compactAutoplayUiMode ? (
            <AutoPlayMinimizedDetail
              title={activeVideo.title}
              toUrl={toUrl}
              onLinkClick={this.onLinkClick}
              compactAutoplayUiMode={compactAutoplayUiMode}
              counter={timeLeft}
            />
          ) : (
            <AutoPlayContents
              contents={contents}
              counter={timeLeft}
              activeIndex={activeIndex}
              isEpisode={isEpisode}
              toUrl={toUrl}
              onTileClick={this.onTileClick}
              onLinkClick={this.onLinkClick}
            />
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: StoreState, { id }: { id: string }) {
  const { video: { byId } } = state;
  return {
    contents: autoPlayContentsSelector(state, id),
    byId,
    isCounterEnabled: !isInGDPRCountryWithKidsSelector(state),
  };
}

export default withRouter(connect(mapStateToProps)(AutoPlay));
