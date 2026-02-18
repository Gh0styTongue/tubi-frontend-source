import { YouboraContentTypes } from 'common/features/playback/constants/youbora';
import hasTrailerValue from 'common/utils/hasTrailerValue';

interface GetYouboraContentTypeProps {
  trailerId: string | number | undefined;
  videoPreviewUrl: string | undefined;
  isSeriesContent: boolean | undefined;
}

export const getYouboraContentType = ({ trailerId, videoPreviewUrl, isSeriesContent }: GetYouboraContentTypeProps) => {
  if (hasTrailerValue(trailerId)) return YouboraContentTypes.TRAILER;
  if (videoPreviewUrl) return YouboraContentTypes.PREVIEW;
  if (isSeriesContent) return YouboraContentTypes.EPISODE;
  return YouboraContentTypes.MOVIE;
};
