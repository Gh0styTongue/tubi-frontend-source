import { useCallback, useRef } from 'react';
import { useStore } from 'react-redux';
import shallowEqual from 'shallowequal';

import { playFireVideo } from 'common/actions/fire';
import { setOTTNavigatingViaAutostartVideoPreview } from 'common/actions/ottUI';
import { loadSeriesEpisodeMetadata } from 'common/actions/video';
import { AUTO_START_CONTENT, SERIES_CONTENT_TYPE } from 'common/constants/constants';
import { CONTENT_EXPIRED, CONTENT_NOT_FOUND, LOAD_CONTENT_FAIL, LOG_SUB_TYPE, MATURE_CONTENT, TRACK_LOGGING } from 'common/constants/error-types';
import { useLocation } from 'common/context/ReactRouterModernContext';
import { getWebTheaterPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { shouldShowMatureContentModalSelector } from 'common/selectors/fire';
import { isEspanolModeEnabledSelector, uiSelector } from 'common/selectors/ui';
import { isVideoExpiredSelector } from 'common/selectors/video';
import type StoreState from 'common/types/storeState';
import type { Video } from 'common/types/video';
import { convertSeriesIdToContentId } from 'common/utils/dataFormatter';
import { trackLogging } from 'common/utils/track';
import { resumePositionAndTargetIDSelector, useVideoPlaybackProps } from 'ott/features/playback/selectors/vod';
import { trackNavigateToPageAfterVideoPreviewFinishEvent } from 'ott/utils/homegrid';

function useAutostartOnPreviewComplete(videoFromProps?: Video) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const store = useStore<StoreState>();
  const { preferredLocale } = useAppSelector(uiSelector);

  const videoPlaybackProps = useVideoPlaybackProps();
  const video = videoFromProps || videoPlaybackProps.video;

  const { resumePosition, targetId: resumeTargetId } = useAppSelector(state => resumePositionAndTargetIDSelector(
    state,
    { location },
    video,
  ), shallowEqual);
  const isEspanolModeEnabled = useAppSelector(isEspanolModeEnabledSelector);
  const isExpired = useAppSelector(state => isVideoExpiredSelector(state, video));
  const shouldShowMatureContentModal = useAppSelector(shouldShowMatureContentModalSelector);

  const reportPlaybackPrevented = useCallback((id: string | undefined, reason: string) => {
    trackLogging({
      type: TRACK_LOGGING.videoInfo,
      subtype: LOG_SUB_TYPE.PLAYBACK.PREVIEW_AUTOPLAY_PREVENTED,
      message: {
        id,
        reason,
      },
    });
  }, []);

  const getPlayId = useCallback(async (data: Video) => {
    const { id: contentId, type } = data;

    if (resumeTargetId) {
      return {
        id: resumeTargetId,
        pos: resumePosition,
      };
    }

    if (type === SERIES_CONTENT_TYPE) {
      let episodeId = data?.seasons?.[0].episodes[0].id;
      if (episodeId) {
        return {
          id: episodeId,
        };
      }
      const seriesId = convertSeriesIdToContentId(contentId);
      const metadata = await dispatch(loadSeriesEpisodeMetadata(seriesId));
      episodeId = metadata?.seasons?.[0].episodes[0].id;

      // reload resume info after we load series meta data
      const { resumePosition: pos, targetId } = resumePositionAndTargetIDSelector(store.getState(), { location }, data);
      if (targetId) {
        return {
          id: targetId,
          pos,
        };
      }
      return {
        id: episodeId,
      };
    }
    return {
      id: contentId,
    };
  }, [dispatch, resumeTargetId, resumePosition, location, store]);

  const isAutostarting = useRef(false);
  const latestIsEspModeEnabledRef = useLatest(isEspanolModeEnabled);
  const latestIsExpiredRef = useLatest(isExpired);
  const latestShouldShowMatureContentModalRef = useLatest(shouldShowMatureContentModal);

  const autostartOnPreviewComplete = useCallback(() => {
    if (isAutostarting.current) return;
    isAutostarting.current = true;

    return getPlayId(video).then(({ id, pos = 0 }) => {
      isAutostarting.current = false;
      const queryString = {
        video_preview: true,
        ...(latestIsEspModeEnabledRef.current && { espanol_mode: latestIsEspModeEnabledRef.current }),
      };

      if (!id) {
        reportPlaybackPrevented(id, CONTENT_NOT_FOUND);
        return;
      }

      if (latestIsExpiredRef.current) {
        reportPlaybackPrevented(id, CONTENT_EXPIRED);
        return;
      }

      if (latestShouldShowMatureContentModalRef.current(video)) {
        reportPlaybackPrevented(id, MATURE_CONTENT);
        return;
      }

      if (__ISOTT__) {
        dispatch(setOTTNavigatingViaAutostartVideoPreview(true));
        trackNavigateToPageAfterVideoPreviewFinishEvent({ contentId: id }, store.getState());
        dispatch(playFireVideo(id, {
          queryString,
          pos,
        }));
      } else {
        tubiHistory.push({
          pathname: getWebTheaterPlayerUrl(id, preferredLocale),
          query: queryString,
          state: {
            [AUTO_START_CONTENT]: true,
          },
        });
      }
    }).catch(() => {
      isAutostarting.current = false;
      reportPlaybackPrevented(undefined, LOAD_CONTENT_FAIL);
    });
  }, [
    video,
    dispatch,
    getPlayId,
    store,
    reportPlaybackPrevented,
    latestIsEspModeEnabledRef,
    latestIsExpiredRef,
    latestShouldShowMatureContentModalRef,
    preferredLocale,
  ]);

  return autostartOnPreviewComplete;
}

export default useAutostartOnPreviewComplete;
