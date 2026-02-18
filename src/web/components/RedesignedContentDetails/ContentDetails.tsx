import { toCSSUrl } from '@adrise/utils/lib/url';
import classnames from 'classnames';
import React, { useCallback, useEffect } from 'react';

import { maybeOverrideCuePoints } from 'client/features/playback/utils/maybeOverrideCuePoints';
import { loadHistory } from 'common/actions/loadHistory';
import { loadSingleTitleReaction } from 'common/actions/userReactions';
import { loadEpisodesInSeries, loadRelatedContents, loadVideoById } from 'common/actions/video';
import { AUTO_START_CONTENT, EPISODE_PAGINATION_PAGE_SIZE, SHOULD_FETCH_DATA_ON_SERVER } from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { getWebTheaterPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { latestEpisodeInfoSelector } from 'common/selectors/history';
import { isKidsModeSelector, uiSelector } from 'common/selectors/ui';
import { adBreaksByContentIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';
import { isSeriesId } from 'common/utils/dataFormatter';
import { useCheckContentAvailability } from 'web/features/playback/containers/Video/hooks/useCheckContentAvailability';
import ContentDetail from 'web/rd/components/ContentDetail/ContentDetail';
import TilePreviewPlayer from 'web/rd/components/TilePreviewPlayer/TilePreviewPlayer';

import styles from './ContentDetails.scss';

interface ContentDetailsProps {
  contentId: string;
  children?: React.ReactNode;
  cls?: string;
  layout?: 'in-modal' | 'full-page';
  episodeId?: string;
}

const ContentDetails = ({
  contentId,
  children,
  cls,
  layout = 'full-page',
  episodeId,
}: ContentDetailsProps) => {
  const dispatch = useAppDispatch();
  const content = useAppSelector((state) => state.video.byId[contentId]);
  const hasFullLoaded = !!content?.video_resources?.length && !!content?.video_previews?.length;
  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const isKidsMode = useAppSelector(isKidsModeSelector);
  const isSeries = content ? content?.type === 's' : isSeriesId(contentId);
  const latestEpisodeInfo = useAppSelector((state) => latestEpisodeInfoSelector(state, contentId)) as Video;
  const imageUrl = content?.hero_images?.[0] || content?.backgrounds?.[0] || content?.thumbnails?.[0] || '';
  const adBreaks = useAppSelector((state) => maybeOverrideCuePoints(adBreaksByContentIdSelector(state, contentId)));
  const { isContentUnavailable, showRemindMe } = useCheckContentAvailability({
    video: content,
    adBreaks,
  });
  const { preferredLocale } = useAppSelector(uiSelector);

  useEffect(() => {
    if (!contentId) return;
    if (isSeries) {
      dispatch(loadEpisodesInSeries({ seriesId: contentId, season: 1, page: 1, size: EPISODE_PAGINATION_PAGE_SIZE, force: !hasFullLoaded }));
    } else {
      dispatch(loadVideoById(contentId, { force: !hasFullLoaded }));
    }

    dispatch(loadRelatedContents(contentId));

    if (isLoggedIn) {
      dispatch(loadHistory());
    }

    const shouldFetchUserReactions = isLoggedIn && !isKidsMode;
    if (shouldFetchUserReactions) {
      dispatch(loadSingleTitleReaction(contentId))
        .catch((e: unknown) => {
          logger.error(e, `Content detail modal - error loading user reactions for ${contentId}`);
        });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, hasFullLoaded]);

  const onClickWatch = useCallback(() => {
    const url = getWebTheaterPlayerUrl(isSeries ? episodeId || latestEpisodeInfo.id : content.id, preferredLocale);

    tubiHistory.push({
      pathname: url,
      state: {
        [AUTO_START_CONTENT]: true,
      },
    });
  }, [latestEpisodeInfo, content, isSeries, preferredLocale, episodeId]);

  const renderPreviewPlayer = useCallback(() => {
    const isServerSideRendering = __SERVER__ && SHOULD_FETCH_DATA_ON_SERVER;
    const hasPreviewUrl = !!content?.video_previews?.[0]?.url;
    const hasTrailerUrl = content?.trailers?.[0]?.url;
    const shouldShowPreview = !isServerSideRendering && (hasPreviewUrl || hasTrailerUrl) && !isContentUnavailable;

    return shouldShowPreview ? (
      <TilePreviewPlayer video={content} shouldAutoStartContent />
    ) : null;
  }, [content, isContentUnavailable]);

  const isPreviewClickable = !isContentUnavailable;

  return (
    <div className={classnames(styles.redesignedContentDetails, cls, styles[layout])}>
      <div
        className={classnames(styles.previewPlayer, { [styles.clickable]: isPreviewClickable })}
        style={{ backgroundImage: toCSSUrl(imageUrl) }}
        data-test-id="preview-player"
        onClick={isPreviewClickable ? onClickWatch : undefined}
      >
        {renderPreviewPlayer()}
      </div>
      <div className={styles.details}>
        {content ?
          <ContentDetail
            content={content}
            seasons={content.seasons}
            onClickWatch={onClickWatch}
            isNewDesign
            shouldShowContentUnavailable={isContentUnavailable}
            isMatureContentGated={false}
            showRemindMe={showRemindMe}
            belongSeries={isSeries ? content.id : undefined}
            episodeId={episodeId}
          /> : null}
      </div>
      {children}
    </div>
  );
};

export default ContentDetails;
