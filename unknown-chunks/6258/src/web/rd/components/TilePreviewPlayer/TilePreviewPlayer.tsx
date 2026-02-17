import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import classNames from 'classnames';
import React, { memo, Suspense } from 'react';

import type { Video } from 'common/types/video';
import { useTilePreviewPlayer } from 'web/hooks/useVideoPreview';

import styles from './TilePreviewPlayer.scss';

const LazyPreviewPlayer = React.lazy(
  () =>
    import(/* webpackChunkName: "preview-player" */ 'common/features/playback/components/PreviewPlayer/PreviewPlayer')
);

const PreviewPlayer = ({ video }: { video: Video}) => {
  const {
    isPreviewVisible,
    isPreviewPaused,
    onPreviewStart,
    onPreviewComplete,
    onPreviewError,
  } = useTilePreviewPlayer();

  return (
    <Suspense fallback={null}>
      <LazyPreviewPlayer
        className={classNames(styles.previewPlayer, { [styles.visible]: isPreviewVisible })}
        video={video}
        previewUrl={video.video_preview_url}
        isVisible
        isPaused={isPreviewPaused}
        onStart={onPreviewStart}
        onPlay={onPreviewStart}
        onError={onPreviewError}
        onComplete={onPreviewComplete}
        videoPlayerState={PlayerDisplayMode.VIDEO_IN_GRID}
        enableMuteButton
        muteButtonClassname={styles.muteButton}
        muteButtonContainerClassname={styles.muteButtonContainer}
        enableLoadingSpinner
        enableProgress
        enableBackground
      />
    </Suspense>
  );
};

export default memo(PreviewPlayer);
