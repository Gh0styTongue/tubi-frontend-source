import type { Query } from 'history';

export const getIsFromAutoplay = (query: Query) => query?.autoplay === 'true';
