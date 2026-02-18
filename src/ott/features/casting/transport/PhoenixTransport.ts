/**
 * Phoenix Transport Layer
 * Manages WebSocket connection and Phoenix channels for casting
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Phoenix types may not be available yet
import type { Channel } from 'phoenix';
import { Socket, Presence } from 'phoenix';

import logger from 'common/helpers/logging';

import { RECONNECT_CONFIG, CHANNEL_JOIN_TIMEOUT, isRetryableError } from '../config';
import type {
  ConnectionParams,
  Envelope,
  PresenceDiff,
  Participant,
  CastingEventHandler,
} from '../types';

/**
 * Server error codes that require special handling
 */
const CRITICAL_ERROR_CODES = {
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  MISSING_AUTH: 'Missing authorization token',
} as const;

/**
 * Check if error response contains a critical error code
 */
/* istanbul ignore next */
function isCriticalError(response: any): boolean {
  const errorCode = response?.error || response?.reason || '';
  return Object.values(CRITICAL_ERROR_CODES).some(code => errorCode.includes(code));
}

/**
 * Logger interface for transport events
 */
export interface TransportLogger {
  log: (message: string, metadata?: any) => void;
  error: (message: string, error?: Error) => void;
}

/**
 * Phoenix transport options
 */
export interface PhoenixTransportOptions {
  url: string;
  connectionParams: ConnectionParams;
  logger?: TransportLogger;
}

/**
 * Phoenix transport class
 * Wraps Phoenix Socket and Channel with auto-reconnect and event management
 */
export class PhoenixTransport {
  private socket: Socket | null = null;
  private channel: Channel | null = null;
  private presence: Record<string, { metas: any[] }> = {};
  private eventHandlers: Map<string, Set<CastingEventHandler<any>>> = new Map();
  private readonly options: PhoenixTransportOptions;
  private readonly logger: TransportLogger;
  private isConnecting = false;
  private isJoined = false;
  private shouldStopReconnecting = false; // Flag to prevent reconnect on auth errors

  constructor(options: PhoenixTransportOptions) {
    this.options = options;
    this.logger = options.logger || {
      log: () => {
        // noop
      },
      error: () => {
        // noop
      },
    };
  }

  /**
   * Connect to Phoenix socket
   */
  connect(): void {
    // Don't reconnect if we hit a non-retryable error
    if (this.shouldStopReconnecting) {
      this.logger.log('[Casting] Reconnecting disabled due to non-retryable error');
      return;
    }

    if (this.isConnecting || this.socket) {
      this.logger.log('[Casting] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.logger.log(`[Casting] Connecting to ${this.options.url}`);

    try {
      this.socket = new Socket(this.options.url, {
        params: this.options.connectionParams,
        reconnectAfterMs: RECONNECT_CONFIG.reconnectAfterMs,
      });

      this.setupSocketEventHandlers();
      this.socket.connect();
    } catch (error) {
      this.logger.error('[Casting] Failed to create socket', error as Error);
      this.isConnecting = false;
      this.emit('error', { error: (error as Error).message });
    }
  }

  /**
   * Disconnect from Phoenix socket
   * @param resetReconnectFlag - If true, allows reconnection after disconnect (default: true)
   */
  disconnect(resetReconnectFlag = true): void {
    this.logger.log('[Casting] Disconnecting');

    if (this.channel) {
      this.channel.leave();
      this.channel = null;
    }

    /* istanbul ignore next */
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = false;
    this.isJoined = false;
    this.presence = {};

    // Reset reconnect flag on explicit disconnect (allows future reconnection)
    // But keep it set if disconnect was triggered by non-retryable error
    if (resetReconnectFlag) {
      this.shouldStopReconnecting = false;
    }
  }

  /**
   * Join a room channel
   */
  joinRoom(roomId: string): Promise<{ participants?: Record<string, Participant> }> {
    if (!this.socket) {
      return Promise.reject(new Error('Socket not connected'));
    }

    if (this.channel) {
      this.logger.log('[Casting] Already joined a channel, leaving first');
      this.channel.leave();
    }

    this.logger.log(`[Casting] Joining room: ${roomId}`);

    return new Promise((resolve, reject) => {
      const channel = this.socket!.channel(`room:${roomId}`, {});

      // Set up channel event handlers
      this.setupChannelEventHandlers(channel);

      // Attempt to join
      channel
        .join(CHANNEL_JOIN_TIMEOUT)
        .receive('ok', (response: any) => {
          this.logger.log('[Casting] Successfully joined room');
          this.channel = channel;
          this.isJoined = true;
          this.emit('joined', response);
          resolve(response);
        })
        .receive('error', (response: any) => {
          this.logger.error('[Casting] Failed to join room', new Error(JSON.stringify(response)));

          // Check for critical errors that require special handling
          const isCritical = isCriticalError(response);
          const retryable = isRetryableError(response);

          /* istanbul ignore next */
          if (isCritical) {
            logger.error({
              error: response,
              errorCode: response?.error || response?.reason,
              context: 'PhoenixTransport',
              action: 'join_room',
              critical: true,
              retryable,
            }, 'Critical casting authentication error');
          }

          // If error is not retryable (e.g., auth errors), stop auto-reconnecting
          if (!retryable) {
            this.shouldStopReconnecting = true;
            this.disconnect(false); // Force disconnect and keep reconnect flag set
          }

          this.emit('error', {
            error: 'Failed to join room',
            details: response,
            critical: isCritical,
            retryable,
          });
          reject(new Error(`Failed to join room: ${JSON.stringify(response)}`));
        })
        .receive('timeout', () => {
          this.logger.error('[Casting] Join timeout');
          this.emit('error', { error: 'Join timeout' });
          reject(new Error('Join timeout'));
        });
    });
  }

  /**
   * Push a message to the channel
   */
  push(event: string, payload: any): Promise<any> {
    if (!this.channel) {
      return Promise.reject(new Error('Channel not joined'));
    }

    return new Promise((resolve, reject) => {
      this.channel!
        .push(event, payload)
        .receive('ok', (response: any) => {
          resolve(response);
        })
        .receive('error', (response: any) => {
          this.logger.error(`Push error for event ${event}`, new Error(JSON.stringify(response)));
          reject(new Error(`Push error: ${JSON.stringify(response)}`));
        })
        .receive('timeout', () => {
          this.logger.error(`Push timeout for event ${event}`);
          reject(new Error('Push timeout'));
        });
    });
  }

  /**
   * Subscribe to events
   */
  on<T = any>(event: string, handler: CastingEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off<T = any>(event: string, handler: CastingEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    /* istanbul ignore else */
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }

  /**
   * Get current participants from presence
   */
  getParticipants(): Participant[] {
    return Presence.list(this.presence, (id: any, metas: any) => ({ id, metas }));
  }

  /**
   * Set up socket event handlers
   */
  /* istanbul ignore next */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onOpen(() => {
      this.logger.log('[Casting] Socket opened');
      this.isConnecting = false;
      this.emit('open', {});
    });

    this.socket.onError((error: any) => {
      this.logger.error('[Casting] Socket error', error as Error);
      this.emit('error', { error: (error as Error)?.message || 'Socket error' });
    });

    this.socket.onClose(() => {
      this.logger.log('[Casting] Socket closed');
      this.isJoined = false;
      this.emit('close', {});
    });
  }

  /**
   * Set up channel event handlers
   */
  /* istanbul ignore next */
  private setupChannelEventHandlers(channel: Channel): void {
    // Handle "message" event (server standard event name)
    // Server wraps messages with: { sender, room_id, ts, payload }
    const handleMessage = (envelope: Envelope) => {
      const payloadType = envelope.payload && typeof envelope.payload === 'object' && 'type' in envelope.payload
        ? (envelope.payload as any).type
        : undefined;
      this.logger.log(`[Casting] Received message: type=${envelope.type || payloadType}`);
      this.emit('message', envelope);
    };

    // Listen to "message" event (server standard)
    channel.on('message', handleMessage);

    // Handle ping from server and auto-respond with pong
    channel.on('ping', (payload: { ts: number; room_id?: string }) => {
      const ts = payload?.ts;
      if (!ts) return;

      this.logger.log(`[Casting] Received ping: ts=${ts}`);

      // Auto-respond with pong - send directly via channel
      const pongPayload = {
        type: 'pong',
        room_id: payload.room_id,
        payload: { ts },
      };

      channel.push('pong', pongPayload, 5000)
        .receive('ok', () => {
          this.logger.log(`[Casting] Pong sent successfully: ts=${ts}`);
          // Emit pong event after successful send
          this.emit('pong', { ts, room_id: payload.room_id });
        })
        .receive('error', (error: any) => {
          this.logger.error('[Casting] Failed to send pong', new Error(JSON.stringify(error)));
        })
        .receive('timeout', () => {
          this.logger.error('[Casting] Push timeout for event pong', new Error('Timeout'));
        });

      // Emit ping event for monitoring
      this.emit('ping', payload);
    });

    // Handle presence_state (initial state when joining)
    channel.on('presence_state', (state: any) => {
      this.logger.log('[Casting] Received presence_state', { deviceCount: Object.keys(state).length });

      this.presence = Presence.syncState(
        this.presence,
        state,
        (id: any, current: any, newPres: any) => {
          // onJoin
          const meta = newPres.metas[0] || {};
          this.logger.log(
            `Presence initial: ${meta.device_name || id} (${meta.platform || 'unknown'})`
          );
        }
      );

      this.emit('presence_state', state);
    });

    // Handle presence_diff (incremental updates)
    channel.on('presence_diff', (diff: PresenceDiff) => {
      this.logger.log('[Casting] Received presence_diff');

      this.presence = Presence.syncDiff(
        this.presence,
        diff,
        (id: any, current: any, newPres: any) => {
          // onJoin
          const meta = newPres.metas[0] || {};
          this.logger.log(
            `Presence join: ${meta.device_name || id} (${meta.platform || 'unknown'})`
          );
        },
        (id: any, current: any, leftPres: any) => {
          // onLeave
          const meta = leftPres.metas[0] || {};
          this.logger.log(
            `Presence leave: ${meta.device_name || id} (${meta.platform || 'unknown'})`
          );
        }
      );

      this.emit('presence_diff', diff);
    });
  }

  /**
   * Emit an event to subscribers
   */
  private emit<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          this.logger.error(`Error in event handler for ${event}`, error as Error);
        }
      });
    }
  }
}

