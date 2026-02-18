/**
 * Singleton Casting Client Manager
 * Manages a single global WebSocket connection for casting
 * Automatically handles token sync and device info
 * Provides global navigation command handling
 */

import { SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import {
  BACK_FROM_DETAIL_TO_HOME,
  BACK_FROM_LIVE_PLAYBACK_TO_HOME,
  BACK_FROM_PLAYBACK_TO_DETAIL,
} from 'common/constants/constants';
import { getPlayerUrl } from 'common/features/playback/utils/getPlayerUrl';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { actionWrapper } from 'common/utils/action';
import { syncAnonymousTokensClient, getAnonymousTokenFromStorage } from 'common/utils/token';

import { CastingClient } from './protocol/CastingClient';
import type { TransportLogger } from './transport/PhoenixTransport';

export interface CastingClientConfig {
  roomId: string; // Required: Must always specify which room to join
  wsUrl?: string;
  logger?: TransportLogger;
  // Optional: override token for testing (will auto-sync if not provided)
  token?: string;
}

class CastingClientManager {
  private static instance: CastingClient | null = null;
  private static currentRoomId: string | null = null;
  private static navigationCommandHandler: ((command: any) => void) | null = null;
  private static dispatch: TubiThunkDispatch | null = null;
  // Cache last metadata for resume command (using optional property for smaller bundle size)
  private static lastMetadata?: {
    contentId: string;
    isLive: boolean;
    position: number;
    subtitleLanguage?: string;
  };
  // Flag to skip next metadata send for old content after play command
  // This prevents race condition where old player sends metadata during unmount
  private static skipNextOldContentMetadata: string | null = null;

  /**
   * Get or create the singleton casting client
   *
   * Rules:
   * 1. If roomId matches current room → reuse existing connection
   * 2. If roomId differs → disconnect old socket, create new connection
   * 3. Only one room/socket at a time
   */
  static async getClient(config: CastingClientConfig): Promise<CastingClient> {
    const { roomId, wsUrl, logger } = config;

    // If client exists and room matches, reuse it
    if (this.instance && this.currentRoomId === roomId) {
      return this.instance;
    }

    // Room changed or first initialization: disconnect old and create new
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.currentRoomId = null;
    }

    // Get token (use provided token or sync from auth system)
    let token = config.token;
    if (!token) {
      await syncAnonymousTokensClient();
      token = getAnonymousTokenFromStorage();
    }

    if (!token) {
      throw new Error('Failed to get authentication token for casting');
    }

    this.instance = new CastingClient({
      roomId,
      token,
      wsUrl,
      logger,
    });

    this.currentRoomId = roomId;

    // Automatically register navigation command handler if not initialized
    // This ensures play commands work from any page
    if (!this.navigationCommandHandler) {
      this.initializeNavigationCommandHandler();
    }

    // Register the handler to this client instance
    /* istanbul ignore else */
    if (this.navigationCommandHandler) {
      this.instance.on('command', this.navigationCommandHandler);
    }

    return this.instance;
  }

  /**
   * Navigate to content for playback
   * Sets back override and navigates to player
   * @param contentId - Content ID to navigate to
   * @param isLive - Whether the content is live
   */
  private static navigateToContent(contentId: string, isLive: boolean): void {
    const deeplinkPage = isLive ? `/ott/live/${contentId}` : getPlayerUrl(contentId);

    if (!this.dispatch) {
      // Dispatch not set, fallback to simple navigation
      tubiHistory.replace(deeplinkPage);
      return;
    }

    // Set back override to handle back button behavior
    if (!isLive) {
      // For VOD: Player -> (back) -> Detail -> (back) -> Home
      this.dispatch(
        actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
          data: { [BACK_FROM_PLAYBACK_TO_DETAIL]: true },
        })
      );
      this.dispatch(
        actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
          data: { [BACK_FROM_DETAIL_TO_HOME]: true },
        })
      );
    } else {
      // For Live: Player -> (back) -> Home
      this.dispatch(
        actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
          data: { [BACK_FROM_LIVE_PLAYBACK_TO_HOME]: true },
        })
      );
    }

    // Navigate to player
    tubiHistory.replace(deeplinkPage);
  }

  /**
   * Initialize navigation command handler
   * Handles play and resume commands for navigation
   */
  private static initializeNavigationCommandHandler(): void {
    this.navigationCommandHandler = (command: any) => {
      // Handle play command with contentId - navigate to content
      if (command.type === 'play' && command.contentId) {
        const oldContentId = this.lastMetadata?.contentId;

        // If switching to different content, set flag to skip next metadata from old content
        // This prevents race condition where old player sends metadata during unmount
        if (oldContentId && oldContentId !== command.contentId) {
          this.skipNextOldContentMetadata = oldContentId;
        }

        this.lastMetadata = {
          contentId: command.contentId,
          isLive: command.isLive ?? /* istanbul ignore next */ false,
          position: command.position ?? 0,
          subtitleLanguage: this.lastMetadata?.subtitleLanguage || '',
        };
        this.navigateToContent(command.contentId, command.isLive);
      }

      // Handle resume command - navigate to last played content if available
      if (command.type === 'resume' && this.lastMetadata) {
        const { contentId, isLive } = this.lastMetadata;
        this.navigateToContent(contentId, isLive);
      }
    };
  }

  /**
   * Get current client instance (if exists)
   */
  static getCurrentClient(): CastingClient | null {
    return this.instance;
  }

  /**
   * Get current room ID
   */
  static getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Check if client is connected
   */
  static isConnected(): boolean {
    return this.instance?.getStatus() === 'connected';
  }

  /**
   * Disconnect and cleanup current connection
   */
  static disconnect(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.currentRoomId = null;
    }
  }

  /**
   * Check if navigation command handler is initialized
   */
  static hasNavigationCommandHandler(): boolean {
    return this.navigationCommandHandler !== null;
  }

  /**
   * Clear navigation command handler (for cleanup/testing)
   */
  static clearNavigationCommandHandler(): void {
    this.navigationCommandHandler = null;
  }

  /**
   * Set Redux dispatch for navigation with back override
   * @param dispatch - Redux dispatch function
   */
  static setDispatch(dispatch: TubiThunkDispatch): void {
    this.dispatch = dispatch;
  }

  /**
   * Get current Redux dispatch (for testing)
   */
  static getDispatch(): TubiThunkDispatch | null {
    return this.dispatch;
  }

  /**
   * Update last played metadata (for resume command)
   * This allows resume command to work even when player is not active
   */
  static updateLastMetadata(
    contentId: string,
    isLive: boolean,
    position: number,
    subtitleLanguage?: string
  ): void {
    this.lastMetadata = {
      contentId,
      isLive,
      position,
      subtitleLanguage,
    };
  }

  /**
   * Get last played metadata
   */
  static getLastMetadata(): {
    contentId: string;
    isLive: boolean;
    position: number;
    subtitleLanguage?: string;
  } | undefined {
    return this.lastMetadata;
  }

  /**
   * Check if metadata should be skipped due to content switch
   * Returns true if the contentId matches the skip flag (meaning we should skip it)
   */
  static shouldSkipMetadata(contentId: string): boolean {
    if (this.skipNextOldContentMetadata === contentId) {
      this.skipNextOldContentMetadata = null; // Clear flag after check
      return true;
    }
    return false;
  }

  /**
   * Clear last metadata (for cleanup/testing)
   */
  static clearLastMetadata(): void {
    delete this.lastMetadata;
    this.skipNextOldContentMetadata = null;
  }
}

export default CastingClientManager;

