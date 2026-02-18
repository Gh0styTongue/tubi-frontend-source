/**
 * For series id, we have two formats.
 * content id: the id in our store, using as a content.
 * For movie/episode, the value equals to video.id, for series, it is equal to "'0' = + series.id"
 * series id: series.id or video.series_id don’t have 0 prefix
 */

export function isSeriesId(id?: string) {
  return !!id && id.startsWith('0');
}

export function convertSeriesIdToContentId(id: undefined): undefined;
export function convertSeriesIdToContentId(id: string): string;
export function convertSeriesIdToContentId(id: string | undefined): string | undefined {
  if (!id) return id;
  return isSeriesId(id) ? id : `0${id}`;
}

export function trimSeriesId(id: undefined): undefined;
export function trimSeriesId(id: string): string;
export function trimSeriesId(id: string | undefined): string | undefined {
  if (!id) return id;
  return isSeriesId(id) ? id.slice(1) : id;
}
