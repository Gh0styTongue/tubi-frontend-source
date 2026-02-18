import type { Trailer } from 'common/types/video';

export function findTrailerById(trailerId: string, trailers: Trailer[]): Trailer | null {
  return trailers.find((t) => t.id === trailerId) || null;
}
