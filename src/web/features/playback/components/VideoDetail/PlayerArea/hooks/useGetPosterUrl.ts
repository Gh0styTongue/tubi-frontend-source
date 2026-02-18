import useAppSelector from 'common/hooks/useAppSelector';
import { isEpisodeSelector, seriesByContentIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';

export const useGetPosterUrl = (contentId: string, video: Video): { posterUrl: string | undefined } => {
  const isEpisode = useAppSelector((state) => isEpisodeSelector(state, contentId));
  const series = useAppSelector((state) => seriesByContentIdSelector(state, contentId));

  let posterUrl: string | undefined = video.posterarts?.[0];

  if (isEpisode) {
    posterUrl = series?.posterarts?.[0];
  }

  return { posterUrl };
};
