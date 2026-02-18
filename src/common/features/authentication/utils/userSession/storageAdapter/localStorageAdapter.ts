/**
 * LocalStorage adapter - stores session data in browser's localStorage.
 * Used for OTT platforms that support localStorage.
 */
import isEqual from 'lodash/isEqual';

import { USER_SESSION_STORAGE_KEY, USER_SESSION_LIST_STORAGE_KEY } from 'common/features/authentication/constants/auth';
import type { UserOrKid } from 'common/features/authentication/types/auth';
import { checkIsKidAccount } from 'common/features/authentication/utils/user';
import {
  isUserSessionAvailable,
  isUserListAvailable,
  transformUserToUserSession,
  parseUserSessionFromStorage,
} from 'common/features/authentication/utils/userSession/helpers';
import { setItem, getItem, removeItem } from 'common/features/authentication/utils/userSession/storage';
import type { SessionStorageAdapter } from 'common/features/authentication/utils/userSession/storageAdapter/types';
import { trackUserSessionLogging } from 'common/features/authentication/utils/userSession/track';
import type { UserSession } from 'common/features/authentication/utils/userSession/types';

export class LocalStorageAdapter implements SessionStorageAdapter {
  async getSession(): Promise<UserSession | null> {
    if (!isUserSessionAvailable()) {
      return null;
    }

    const jsonifiedUser = await getItem(USER_SESSION_STORAGE_KEY);
    if (!jsonifiedUser) {
      return null;
    }

    return parseUserSessionFromStorage(jsonifiedUser);
  }

  async getSessionList(): Promise<UserSession[]> {
    if (!isUserListAvailable()) {
      return [];
    }

    const jsonifiedUserList = await getItem(USER_SESSION_LIST_STORAGE_KEY);
    if (!jsonifiedUserList) {
      return [];
    }

    try {
      return JSON.parse(jsonifiedUserList);
    } catch (error) {
      removeItem(USER_SESSION_LIST_STORAGE_KEY);
      return [];
    }
  }

  async saveSession(user: UserOrKid): Promise<void> {
    if (!isUserSessionAvailable()) {
      return;
    }

    const currentUserSession = await this.getSessionByTubiId(user.tubiId);
    const userSession = transformUserToUserSession(user, { createdAt: currentUserSession?.createdAt });
    const isSuccess = await setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to save user session to localStorage',
        loggerConfig: { shouldSend: false },
      });
      return;
    }

    await this.addToSessionList(userSession);
  }

  async removeSession(): Promise<void> {
    const currentSession = await this.getSession();
    await removeItem(USER_SESSION_STORAGE_KEY);
    if (currentSession) {
      await this.removeFromSessionList(currentSession);
    }
  }

  async updateSession(updatedFields: Partial<UserSession>): Promise<void> {
    const userSession = await this.getSession();
    if (!userSession) {
      return;
    }

    const { updateSessionFields } = await import('../helpers');
    const updatedUserSession = updateSessionFields(userSession, updatedFields);
    if (!updatedUserSession) {
      return;
    }

    const isSuccess = await setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(updatedUserSession));
    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to update user session in localStorage',
      });
      return;
    }

    await this.updateSessionInList(updatedUserSession);
  }

  async addToSessionList(session: UserSession): Promise<void> {
    if (!isUserListAvailable() || checkIsKidAccount(session)) {
      return;
    }

    const userList = await this.getSessionList();
    const existingSession = userList.find((u: UserSession) => u.tubiId === session.tubiId);
    if (existingSession) {
      if (!isEqual(existingSession, session)) {
        await this.updateSessionInList(session);
      }
      return;
    }

    userList.push(session);
    const isSuccess = await setItem(USER_SESSION_LIST_STORAGE_KEY, JSON.stringify(userList));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to add user to user sessions list in localStorage',
        loggerConfig: { shouldSend: false },
      });
    }
  }

  async updateSessionList(userList: UserSession[]): Promise<void> {
    if (!isUserListAvailable()) {
      return;
    }

    const isSuccess = await setItem(USER_SESSION_LIST_STORAGE_KEY, JSON.stringify(userList));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to update user sessions list in localStorage',
        loggerConfig: { shouldSend: false },
      });
    }
  }

  async removeFromSessionList(sessionParam?: UserSession): Promise<void> {
    if (!isUserListAvailable()) {
      return;
    }

    const userSession = sessionParam || (await this.getSession());
    if (!userSession) {
      return;
    }

    const userList = await this.getSessionList();
    const updatedUserList = userList.filter((u: UserSession) => u.tubiId !== userSession.tubiId);
    const isSuccess = await setItem(USER_SESSION_LIST_STORAGE_KEY, JSON.stringify(updatedUserList));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to remove user from user sessions list in localStorage',
        loggerConfig: { shouldSend: false },
      });
    }
  }

  async switchSession(tubiId: string): Promise<UserSession | null> {
    if (!isUserSessionAvailable()) {
      return null;
    }

    const sessionList = await this.getSessionList();
    const session = sessionList.find((s: UserSession) => s.tubiId === tubiId);

    if (!session) {
      trackUserSessionLogging({
        message: 'User not found in session list when switching',
        loggerConfig: { data: { tubiId } },
      });
      return null;
    }

    const updatedSession = { ...session, updatedAt: Date.now() };
    const isSuccess = await setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(updatedSession));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to switch user session in localStorage',
        loggerConfig: { shouldSend: false },
      });
      return null;
    }

    await this.updateSessionInList(updatedSession);

    return updatedSession;
  }

  private async getSessionByTubiId(tubiId: UserOrKid['tubiId']): Promise<UserSession | undefined> {
    const userSession = await this.getSession();
    if (userSession && userSession.tubiId === tubiId) {
      return userSession;
    }

    if (isUserListAvailable()) {
      const userSessionList = await this.getSessionList();
      return userSessionList.find((session: UserSession) => session.tubiId === tubiId);
    }
    return undefined;
  }

  private async updateSessionInList(updatedSession: UserSession): Promise<void> {
    if (!isUserListAvailable() || checkIsKidAccount(updatedSession)) {
      return;
    }

    const userList = await this.getSessionList();
    const updatedUserList = userList.map((originalSession: UserSession) => {
      if (originalSession.tubiId === updatedSession.tubiId) {
        return updatedSession;
      }
      return originalSession;
    });

    const isSuccess = await setItem(USER_SESSION_LIST_STORAGE_KEY, JSON.stringify(updatedUserList));

    if (!isSuccess) {
      trackUserSessionLogging({
        message: 'Failed to update user session in user sessions list in localStorage',
        loggerConfig: { shouldSend: false },
      });
    }
  }
}

// Singleton instance for localStorage adapter (no dependencies)
let localStorageAdapter: SessionStorageAdapter | null = null;

/**
 * Create or get the localStorage adapter instance.
 * Uses singleton pattern - creates instance on first call, reuses on subsequent calls.
 */
export const createLocalStorageAdapter = (): SessionStorageAdapter => {
  if (!localStorageAdapter) {
    localStorageAdapter = new LocalStorageAdapter();
  }
  return localStorageAdapter;
};

