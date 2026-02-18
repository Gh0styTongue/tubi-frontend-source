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

const PreviewPlayer = ({ video, shouldAutoStartContent }: { video: Video, shouldAutoStartContent?: boolean}) => {
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
        previewUrl={video.video_previews?.[0]?.url || video.trailers?.[0]?.url}
        isVisible
        isPaused={isPreviewPaused}
        onStart={onPreviewStart}
        onPlay={onPreviewStart}
        onError={onPreviewError}
        onComplete={onPreviewComplete}
        videoPlayerState={PlayerDisplayMode.VIDEO_IN_GRID}
        enableMuteButton
        muteButtonClassname={styles.muteButton}
        muteButtonContainerClassname={classNames(styles.muteButtonContainer, { [styles.visible]: isPreviewVisible })}
        enableBackground
        shouldAutoStartContent={shouldAutoStartContent}
      />
    </Suspense>
  );
};

export default memo(PreviewPlayer);
