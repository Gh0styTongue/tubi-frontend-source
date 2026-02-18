export default function hasTrailerValue(trailerId: string | undefined | number): boolean {
  return !!(trailerId || typeof trailerId === 'number');
}

