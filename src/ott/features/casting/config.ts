/**
 * Configuration for the OTT casting system
 */

import config from '../../../config';

/**
 * Get default WebSocket URL based on environment
 * Dev: localhost
 * Staging/Production: use voyager URL from config
 */
function getDefaultCastingWsUrl(): string {
  return config.voyagerSocketUrl;
}

/**
 * Default WebSocket URL for casting server
 * Can be overridden by environment variable or runtime configuration
 */
export const DEFAULT_CASTING_WS_URL = getDefaultCastingWsUrl();

/**
 * Metadata update interval in milliseconds
 * Metadata is sent every 10 seconds when actively playing (rate > 0)
 */
export const METADATA_INTERVAL_MS = 10000;

/**
 * Deduplication window size
 * Number of recent msg_ids to keep for duplicate detection
 */
export const DEDUP_WINDOW = 100;

/**
 * Error codes that should not be retried
 * These are permanent errors that won't resolve with retry
 */
export const NON_RETRYABLE_ERROR_CODES = [
  'TOKEN_INVALID',
  'TOKEN_EXPIRED',
  'PERMISSION_DENIED',
  'ROOM_NOT_FOUND',
  'ROOM_CLOSED',
  'INVALID_ROOM',
  'Missing authorization token',
] as const;

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorCode = error?.error || error?.reason || error?.message || '';
  const errorString = String(errorCode);

  // Check if error code matches any non-retryable error
  return !NON_RETRYABLE_ERROR_CODES.some(code =>
    errorString.includes(code)
  );
}

/**
 * Phoenix socket reconnection configuration
 */
export const RECONNECT_CONFIG = {
  enabled: true,
  maxRetries: 3,
  reconnectAfterMs: (tries: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
    return Math.min(1000 * 2 ** tries, 30000);
  },
};

/**
 * Channel join timeout
 */
export const CHANNEL_JOIN_TIMEOUT = 10000;

/**
 * Get relay WebSocket URL from environment or configuration
 */
export function getCastingWsUrl(): string {
  if (__CLIENT__ && typeof window !== 'undefined') {
    // Check for window-level configuration override
    const windowConfig = (window as any).CASTING_CONFIG;
    if (windowConfig?.wsUrl) {
      return windowConfig.wsUrl;
    }
  }

  // Use environment variable if available
  if (typeof process !== 'undefined' && process.env.CASTING_WS_URL) {
    return process.env.CASTING_WS_URL;
  }

  return DEFAULT_CASTING_WS_URL;
}

/**
 * Get deduplication window size from configuration
 */
export function getDedupWindow(): number {
  if (__CLIENT__ && typeof window !== 'undefined') {
    const windowConfig = (window as any).CASTING_CONFIG;
    if (windowConfig?.dedupWindow) {
      return windowConfig.dedupWindow;
    }
  }

  return DEDUP_WINDOW;
}

