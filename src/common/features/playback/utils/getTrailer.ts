import type { Trailer } from 'common/types/video';
import hasTrailerValue from 'common/utils/hasTrailerValue';
import { findTrailerById } from 'ott/features/playback/utils/findTrailerById';

export const getTrailer = (trailers: Trailer[], trailerId?: string | number) => {
  if (hasTrailerValue(trailerId)) {
    const trailer = findTrailerById(`${trailerId}`, trailers as Trailer[]);
    if (trailer && trailer.url) {
      return { mediaUrl: trailer.url };
    }
  }
  return { mediaUrl: '' };
};
