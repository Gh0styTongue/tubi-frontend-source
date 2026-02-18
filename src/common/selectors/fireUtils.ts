import type { StoreState } from 'common/types/storeState';

export const appVersionSelector = ({ fire }: StoreState) => fire?.appVersion || {};
