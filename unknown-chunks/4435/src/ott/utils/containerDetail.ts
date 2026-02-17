import { getContainerDetailPageStyleConstants } from 'common/constants/style-constants';

export interface ShouldRequestMoreVideosParams {
  titlesPerRow?: number;
  rowsToShow?: number;
  nextIndex: number;
  totalVideosCount: number | null;
}

const { TILES_PER_ROW, RENDERED_ROWS } = getContainerDetailPageStyleConstants();

export const shouldRequestMoreVideos = ({
  titlesPerRow = TILES_PER_ROW,
  rowsToShow = RENDERED_ROWS,
  nextIndex,
  totalVideosCount,
}: ShouldRequestMoreVideosParams) => {
  if (totalVideosCount === null) return false;

  const nextRow = Math.floor(nextIndex / titlesPerRow);
  const totalRows = Math.ceil(totalVideosCount / titlesPerRow);

  // should request more videos if the next row + rows to show are greater than the total rows with loaded videos
  return (nextRow + rowsToShow) > totalRows;
};
