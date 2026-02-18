/**
 * Non-reactive store for temporarily storing auth token during Web account switching.
 *
 * Why: On Web, we can't call updateUserState() before redirect (causes "Oh snap" error),
 * but loginCallback needs the new token for API requests. This store bridges that gap.
 *
 * Uses getState()/setState() to avoid triggering React re-renders.
 */
import { create } from 'zustand';

interface PendingTokenState {
  token: string | null;
}

const usePendingTokenStore = create<PendingTokenState>(() => ({
  token: null,
}));

export const setPendingAuthToken = (token: string | null): void => {
  usePendingTokenStore.setState({ token });
};

export const getPendingAuthToken = (): string | null => {
  return usePendingTokenStore.getState().token;
};

export const clearPendingAuthToken = (): void => {
  usePendingTokenStore.setState({ token: null });
};

// For test cleanup
export const resetPendingTokenStore = (): void => {
  usePendingTokenStore.setState({ token: null });
};
