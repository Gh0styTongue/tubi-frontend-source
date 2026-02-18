import type { Season } from 'common/types/series';

const EMPTY_ARRAY: string[] = [];

export const getSeasonNumber = (seasons: Season[], seasonIndex: number) => {
  return seasons[seasonIndex] ? Number(seasons[seasonIndex].number) : 0;
};

export const getContentIds = (seasons: Season[] = [], seasonIndex: number) => {
  return seasons[seasonIndex]?.episodes?.map(({ id }) => id) || EMPTY_ARRAY;
};
