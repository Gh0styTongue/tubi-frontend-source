import { toCSSUrl } from '@adrise/utils/lib/url';
import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import { Spinner } from '@tubitv/web-ui';
import type { Location } from 'history';
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { connect } from 'react-redux';

import { loadHomeScreen } from 'common/actions/container';
import { loadVideoById } from 'common/actions/video';
import { SET_CHANNEL_GUIDE_LOADED } from 'common/constants/action-types';
import { FREEZED_EMPTY_OBJECT, HOME_DATA_SCOPE, CONTENT_MODES } from 'common/constants/constants';
import { setLiveActiveContent, setLiveVideoPlayer } from 'common/features/playback/actions/live';
import { isPurpleCarpetContentSelector, shouldLockPurpleCarpetSelector } from 'common/features/purpleCarpet/selector';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { liveVideoSelector } from 'common/selectors/webLive';
import type StoreState from 'common/types/storeState';
import type { TubiContainerFC } from 'common/types/tubiFC';
import type { Video } from 'common/types/video';
import { actionWrapper } from 'common/utils/action';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import { checkIfVodContentInLivePlayer } from 'common/utils/errorCapture';
import { getLogLevel } from 'common/utils/log';
import { getUrl } from 'common/utils/urlConstruction';
import Footer from 'web/components/Footer/Footer';
import { castVideo } from 'web/features/playback/actions/chromecast';
import ChromecastPlayButton from 'web/features/playback/components/ChromecastPlayButton/ChromecastPlayButton';
import WebLivePlayer from 'web/features/playback/components/WebLivePlayer/WebLivePlayer';
import { WebFoxLivePlayer } from 'web/features/purpleCarpet/components/WebFoxLivePlayer/WebFoxLivePlayer';
import VideoObjectSchema from 'web/features/seo/components/VideoObjectSchema/VideoObjectSchema';
import { getVideoMetaForSEO } from 'web/features/seo/utils/getVideoMetaForSEO';

import ChannelDetails from './ChannelDetails/ChannelDetails';
import styles from './LivePlayer.scss';

type Props = ReturnType<typeof mapStateToProps>;

export type RouteParams = {
  id: string;
};

export const CHANNELS_LIMIT = 9999;

export const LivePlayer: TubiContainerFC<Props, RouteParams> = ({
  posterUrl,
  contentId,
  loading,
  video,
  isMobile,
  isCasting,
  isDeeplink,
}) => {
  const dispatch = useAppDispatch();
  const deviceId = useAppSelector(deviceIdSelector);
  const isPurpleCarpetContent = useAppSelector((state) => isPurpleCarpetContentSelector(state, contentId));
  const shouldLockPurpleCarpet = useAppSelector(shouldLockPurpleCarpetSelector);

  useLayoutEffect(() => {
    // redirect to the details page when the guest user landing to the purple carpet playback page directly
    // redirect to the details page when the mobile user landing to the purple carpet playback page
    if (isPurpleCarpetContent && (shouldLockPurpleCarpet || isMobile)) {
      tubiHistory.replace(getUrl({
        id: video.id,
        title: video.title,
        type: video.type,
      }));
    }
  }, [shouldLockPurpleCarpet, isPurpleCarpetContent, video, isMobile]);

  useEffect(() => {
    dispatch(setLiveActiveContent({ contentId }));
  }, [contentId, dispatch]);

  const meta = useMemo(() => getVideoMetaForSEO({ video: video as Video, deviceId }), [video, deviceId]);

  const castVideoContent = useCallback(() => {
    dispatch(castVideo(contentId));
  }, [dispatch, contentId]);

  const shouldNotShowBackground = !posterUrl || !isMobile;

  return (
    <React.Fragment>
      <Helmet {...meta} />

      <div className={styles.root}>
        {shouldNotShowBackground ? null : (
          <React.Fragment>
            <div className={styles.background} style={{ backgroundImage: toCSSUrl(posterUrl) }} />
            <div className={styles.overlay} />
          </React.Fragment>
        )}
        {!isCasting && loading ? <Spinner className={styles.loadingSpinner} /> : null}
        {isPurpleCarpetContent
          ? <WebFoxLivePlayer contentId={contentId} />
          : isCasting
            ? (
              <div className={styles.castButton}>
                <div>
                  <ChromecastPlayButton
                    className={styles.chromecastPlayButton}
                    contentId={contentId}
                    castContent={castVideoContent}
                  />
                </div>
              </div>
            ) : (
              <WebLivePlayer contentId={contentId} isDeeplink={isDeeplink} />
            )}
        {!isMobile && (
          <React.Fragment>
            {isPurpleCarpetContent ? null : <ChannelDetails channel={video} />}
            <Footer purpleCarpet={isPurpleCarpetContent} useRefreshStyle contentId={contentId} />
          </React.Fragment>
        )}
      </div>

      <VideoObjectSchema video={video} />
    </React.Fragment>
  );
};

export const mapStateToProps = (
  state: StoreState,
  { params: { id }, location }: { params: { id: string }; location?: Location }
) => {
  const { query = {} } = location || (FREEZED_EMPTY_OBJECT as Location);
  const isDeeplink = isDeepLinkOnWeb(query);
  const { chromecast } = state;
  const video = liveVideoSelector(state, id);
  const { castReceiverState } = chromecast;
  const isCasting = !!(
    typeof window !== 'undefined' &&
    window.cast &&
    castReceiverState === window.cast.framework.CastState.CONNECTED
  );

  return {
    video,
    contentId: id,
    posterUrl: video?.backgrounds?.[0] || video?.posterarts?.[0],
    hasSubtitle: video?.has_subtitle ?? false,
    loading: state.live.loading,
    isMobile: state.ui.isMobile,
    isCasting,
    isDeeplink,
  };
};

LivePlayer.fetchData = async ({ getState, dispatch, params }) => {
  const { id } = params;
  dispatch(setLiveVideoPlayer(PlayerDisplayMode.DEFAULT));

  try {
    let video = liveVideoSelector(getState(), id);
    if (!video) {
      await dispatch(loadVideoById(id));
      video = liveVideoSelector(getState(), id);
    }
    checkIfVodContentInLivePlayer(video?.type);
  } catch (error) {
    const loggerType = getLogLevel(error.errType);
    logger[loggerType]({ error, contentId: id }, 'error when loading data for WebLivePlayer container');
    return Promise.reject(error);
  }
};

export const fetchData = LivePlayer.fetchData;

LivePlayer.fetchDataDeferred = async ({ getState, dispatch, location }) => {
  const {
    live: { channelGuideLoaded },
    ui: { isMobile },
  } = getState();

  if (!channelGuideLoaded && isMobile) {
    // We only display the channel list on mobile live player page
    // And the linear content mode is deprecated in the tensor v4 endpoint
    // https://tubi.slack.com/archives/C06ERF9RY67/p1713917906734989?thread_ts=1713917553.843889&cid=C06ERF9RY67
    await dispatch(
      loadHomeScreen({
        location,
        scope: HOME_DATA_SCOPE.all,
        contentMode: CONTENT_MODES.linear,
        limit: CHANNELS_LIMIT,
        loadChannelGuide: true,
      })
    );
    dispatch(actionWrapper(SET_CHANNEL_GUIDE_LOADED, { channelGuideLoaded: true }));
  }
};

export const fetchDataDeferred = LivePlayer.fetchDataDeferred;

LivePlayer.hasDynamicMeta = true;

export default connect(mapStateToProps)(LivePlayer);
