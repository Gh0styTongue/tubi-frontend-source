import { useLocation } from 'common/context/ReactRouterModernContext';

export function usePlaybackOriginFromQuery() {
  const query = useLocation().query;
  return {
    isFromAutoplay: !!query.autoplay,
    isFromBrowseWhileWatching: !!query.bww,
    isFromVideoPreview: !!query.video_preview,
  };
}

