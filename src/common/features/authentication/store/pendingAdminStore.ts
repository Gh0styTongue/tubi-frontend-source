/**
 * Non-reactive store for temporarily storing admin user info during kid account creation flow.
 *
 * Why: When a user selects an admin account to create a kid account, we don't want to
 * immediately activate that user (which would change the active user state). Instead,
 * we store the admin user info here and use it for:
 * 1. Displaying the admin's name and avatar in the SetupForm
 * 2. Using the admin's token for the addKidAccount API call
 *
 * This ensures the active user doesn't change if the user cancels the kid account creation flow.
 *
 * Uses getState()/setState() to avoid triggering React re-renders.
 */
import { create } from 'zustand';

import type { AvatarUrl, User } from 'common/features/authentication/types/auth';

interface PendingAdminUser {
  name: string;
  token: string;
  avatarUrl?: AvatarUrl;
  hasPIN?: boolean;
}

interface PendingAdminState {
  admin: PendingAdminUser | null;
}

const usePendingAdminStore = create<PendingAdminState>(() => ({
  admin: null,
}));

interface SetPendingAdminOptions {
  hasPIN?: boolean;
}

export const setPendingAdmin = (user: User, options?: SetPendingAdminOptions): void => {
  usePendingAdminStore.setState({
    admin: {
      name: user.name || '',
      token: user.token || '',
      avatarUrl: user.avatarUrl,
      hasPIN: options?.hasPIN,
    },
  });
};

export const getPendingAdmin = (): PendingAdminUser | null => {
  return usePendingAdminStore.getState().admin;
};

export const clearPendingAdmin = (): void => {
  usePendingAdminStore.setState({ admin: null });
};

// Hook for reactive access in components
export const usePendingAdmin = (): PendingAdminUser | null => {
  return usePendingAdminStore((state) => state.admin);
};

