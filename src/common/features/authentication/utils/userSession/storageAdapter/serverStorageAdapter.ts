/**
 * Server storage adapter - stores session data in Redis via server API.
 * Used for Web and Comcast platforms where localStorage is not available or reliable.
 *
 * SECURITY: This adapter does NOT use localStorage. Session data must never be
 * leaked to localStorage when using server storage.
 */
import type { UserOrKid, User } from 'common/features/authentication/types/auth';
import { checkIsMultipleAccountsV2Enabled } from 'common/features/authentication/utils/multipleAccounts';
import { checkIsKidAccount } from 'common/features/authentication/utils/user';
import { transformUserToUserSession } from 'common/features/authentication/utils/userSession/helpers';
import type { SessionStorageAdapter } from 'common/features/authentication/utils/userSession/storageAdapter/types';
import type { UserSession } from 'common/features/authentication/utils/userSession/types';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { getClientUser } from 'common/utils/server';

class ServerStorageAdapter implements SessionStorageAdapter {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getSession(): Promise<UserSession | null> {
    try {
      const user = await this.client.get('/oz/user');
      if (!user) {
        return null;
      }
      return transformUserToUserSession(getClientUser(user) as UserOrKid, {});
    } catch (err) {
      logger.error({ err }, 'Failed to get session from server');
      return null;
    }
  }

  async getSessionList(): Promise<UserSession[]> {
    try {
      const response = await this.client.get('/oz/user/list');
      const { userList = [] } = response;
      return userList.map((user: User) => transformUserToUserSession(getClientUser(user) as UserOrKid, {}));
    } catch (err) {
      logger.error({ err }, 'Failed to get session list from server');
      return [];
    }
  }

  async saveSession(user: UserOrKid): Promise<void> {
    try {
      const isMultipleAccountsEnabled = checkIsMultipleAccountsV2Enabled();
      // Convert token to accessToken for server compatibility
      // Redux state uses 'token' (via getClientUser), but server expects 'accessToken'
      const accessToken = user.accessToken || user.token;
      await this.client.post('/oz/user', {
        data: { ...user, accessToken, isMultipleAccountsEnabled },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to save session to server');
    }
  }

  async removeSession(): Promise<void> {
    const currentSession = await this.getSession();

    // First remove from session list while user is still authenticated
    // (DELETE /oz/user/list/:tubiId requires ensureAuth middleware)
    if (currentSession) {
      await this.removeFromSessionList(currentSession);
    }

    // Then logout (this clears passport.user, so must be done after removeFromSessionList)
    try {
      await this.client.post('/oz/user/logout', { data: { intentional: true } });
    } catch (err) {
      // 401 means user is already logged out (session expired, concurrent logout requests, etc.)
      // This is expected and we can safely ignore it since the goal is to be logged out.
      if (err.status !== 401) {
        logger.error({ err }, 'Failed to remove session from server');
      }
    }
  }

  async updateSession(fields: Partial<UserSession>): Promise<void> {
    try {
      await this.client.patch('/oz/user', {
        data: { ...fields },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update session on server');
    }
  }

  /**
   * Add a session to the server-side user list.
   * Kid accounts are not added to the list (consistent with LocalStorageAdapter).
   */
  async addToSessionList(session: UserSession): Promise<void> {
    if (checkIsKidAccount(session)) {
      return;
    }

    try {
      const isMultipleAccountsEnabled = checkIsMultipleAccountsV2Enabled();
      await this.client.post('/oz/user', {
        data: { ...session, isMultipleAccountsEnabled },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to add session to server list');
    }
  }

  /**
   * Update the entire session list on the server.
   */
  async updateSessionList(userList: UserSession[]): Promise<void> {
    try {
      await this.client.put('/oz/user/list', {
        data: { userList },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update session list on server');
    }
  }

  /**
   * Remove a specific user from the server-side session list.
   * If no session is provided, removes the current session from the list.
   */
  async removeFromSessionList(session?: UserSession): Promise<void> {
    try {
      const tubiId = session?.tubiId;
      if (!tubiId) {
        const currentSession = await this.getSession();
        if (!currentSession?.tubiId) {
          logger.warn('Cannot remove from session list: no tubiId available');
          return;
        }
        await this.client.del(`/oz/user/list/${currentSession.tubiId}`);
        return;
      }

      await this.client.del(`/oz/user/list/${tubiId}`);
    } catch (err) {
      logger.error({ err }, 'Failed to remove session from server list');
    }
  }

  /**
   * Switch to an existing user session by tubiId.
   * Looks up the user from server session list and calls the switch endpoint.
   */
  async switchSession(tubiId: string): Promise<UserSession | null> {
    try {
      const sessionList = await this.getSessionList();
      const session = sessionList.find((s: UserSession) => s.tubiId === tubiId);

      if (!session) {
        logger.error({ tubiId }, 'User not found in server session list when switching');
        return null;
      }

      const response = await this.client.post('/oz/user/switch', {
        data: { ...session, accessToken: session.accessToken },
      });

      return transformUserToUserSession(getClientUser(response) as UserOrKid, {});
    } catch (err) {
      logger.error({ err, tubiId }, 'Failed to switch session on server');
      return null;
    }
  }
}

/**
 * Create a server storage adapter with the provided ApiClient.
 * A new instance is created each time since the client may vary.
 */
export const createServerStorageAdapter = (client: ApiClient): SessionStorageAdapter => {
  return new ServerStorageAdapter(client);
};
