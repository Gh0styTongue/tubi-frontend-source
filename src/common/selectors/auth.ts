import type { StoreState } from 'common/types/storeState';

export const deviceIdSelector = (state: StoreState) => state.auth.deviceId ?? '';

