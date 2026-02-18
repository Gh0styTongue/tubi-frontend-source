/**
 * Casting client
 * Main client implementation with protocol features:
 * - Phoenix Channels transport
 * - ping/pong heartbeat
 * - msg_id deduplication
 * - Command processing
 */

import logger from 'common/helpers/logging';

import {
  getCastingWsUrl,
  getDedupWindow,
} from '../config';
import type { TransportLogger } from '../transport/PhoenixTransport';
import { PhoenixTransport } from '../transport/PhoenixTransport';
import type {
  Envelope,
  CastingEventHandler,
  CastingStatus,
  MetadataPayload,
} from '../types';
import { isEnvelope, isCommandPayload } from '../utils/guards';
import { LruSet } from '../utils/lru';

/**
 * Casting client options
 */
export interface CastingClientOptions {
  roomId: string;
  token?: string;
  wsUrl?: string; // Custom WebSocket URL (defaults to getCastingWsUrl())
  dedupWindow?: number;
  logger?: TransportLogger;
}

/**
 * Main casting client
 * Implements protocol-level features: Phoenix transport, ping/pong, msg_id deduplication
 */
export class CastingClient {
  private transport: PhoenixTransport;
  private readonly options: CastingClientOptions;
  private readonly logger: TransportLogger;
  private status: CastingStatus = 'idle';

  // Message deduplication with LRU
  private processedMsgIds: LruSet;
  private readonly dedupWindow: number;

  // Event handlers
  private eventHandlers: Map<string, Set<CastingEventHandler<any>>> = new Map();

  constructor(options: CastingClientOptions) {
    this.options = options;
    this.dedupWindow = options.dedupWindow || getDedupWindow();
    this.processedMsgIds = new LruSet(this.dedupWindow);
    this.logger = options.logger || {
      log: () => {
        // noop
      },
      error: () => {
        // noop
      },
    };

    // Create transport (per server docs: only token is needed in params)
    this.transport = new PhoenixTransport({
      url: options.wsUrl || getCastingWsUrl(),
      connectionParams: {
        token: options.token,
        platform: __OTTPLATFORM__,
      },
      logger: this.logger,
    });
    this.setupTransportHandlers();
  }

  /**
   * Connect and join room
   */
  /* istanbul ignore next */
  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') {
      this.logger.log('[Casting] Already connected or connecting');
      return;
    }

    this.setStatus('connecting');

    try {
      // Connect to socket
      this.transport.connect();

      // Wait for socket to be open
      await this.waitForOpen();

      // Join room
      await this.transport.joinRoom(this.options.roomId);

      this.setStatus('connected');
      this.logger.log('[Casting] Connected and joined room');
    } catch (error) {
      this.setStatus('error');
      this.logger.error('[Casting] Connection failed', error as Error);

      logger.error({
        error,
        roomId: this.options.roomId,
        context: 'CastingClient',
        action: 'connect',
      }, 'Failed to connect to casting room');

      throw error;
    }
  }

  /**
   * Disconnect from casting
   */
  disconnect(): void {
    this.logger.log('[Casting] Disconnecting');
    this.transport.disconnect();
    this.setStatus('disconnected');
  }

  /**
   * Send a casting message with ack tracking
   */
  sendRelay<T = any>(payload: any): Promise<T> {
    /* istanbul ignore next */
    if (!this.transport.isConnected()) {
      return Promise.reject(new Error('Not connected'));
    }

    this.logger.log(`[Casting] Sending message: payload.type=${payload.type}`);

    // Server standard: send payload directly, server will wrap with sender/room_id/ts
    // No need to create envelope on client side
    // Push to channel using 'message' event (server standard)
    return this.transport.push('message', payload);
  }

  /**
   * Send metadata
   */
  async sendMetadata(metadata: MetadataPayload): Promise<void> {
    await this.sendRelay(metadata);
  }

  /**
   * Get current status
   */
  getStatus(): CastingStatus {
    return this.status;
  }

  /**
   * Get participants in room
   */
  /* istanbul ignore next */
  getParticipants() {
    return this.transport.getParticipants();
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
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Set up transport event handlers
   */
  /* istanbul ignore next */
  private setupTransportHandlers(): void {
    // Handle casting messages
    this.transport.on('message', (envelope: Envelope) => {
      this.handleCastingMessage(envelope);
    });

    // Handle ping - Note: PhoenixTransport auto-responds with pong
    // We just emit the event for monitoring/logging purposes
    this.transport.on('ping', (payload: { ts: number }) => {
      this.emit('ping', payload);
    });

    // Handle presence_diff
    this.transport.on('presence_diff', (diff) => {
      this.emit('presence_diff', diff);
    });

    // Handle joined
    this.transport.on('joined', (response) => {
      this.emit('joined', response);
    });

    // Handle errors
    this.transport.on('error', (data) => {
      this.emit('error', data);
    });

    // Handle close
    this.transport.on('close', () => {
      if (this.status === 'connected') {
        this.setStatus('disconnected');
      }
    });
  }

  /**
   * Handle incoming casting message
   */
  private handleCastingMessage(envelope: Envelope): void {
    // Validate envelope
    /* istanbul ignore next */
    if (!isEnvelope(envelope)) {
      this.logger.log('[Casting] Invalid envelope received');
      logger.error({
        envelope,
        context: 'CastingClient',
        action: 'handle_message',
      }, 'Invalid envelope structure received');
      return;
    }

    // Check for msg_id deduplication
    /* istanbul ignore next */
    if (envelope.msg_id) {
      if (this.processedMsgIds.has(envelope.msg_id)) {
        const payloadType = envelope.payload && typeof envelope.payload === 'object' && 'type' in envelope.payload
          ? (envelope.payload as any).type
          : 'unknown';
        this.logger.log(
          `[Casting] Duplicate message ignored: msg_id=${envelope.msg_id}, type=${payloadType}`
        );
        return;
      }

      // Add to LRU set (auto-evicts oldest)
      this.processedMsgIds.add(envelope.msg_id);
    }

    this.processCastingMessage(envelope);
  }

  /**
   * Process casting message
   */
  /* istanbul ignore next */
  private processCastingMessage(envelope: Envelope): void {
    const payload = envelope.payload;

    if (!payload || !isCommandPayload(payload)) {
      this.logger.log('[Casting] Invalid casting message payload');
      logger.error({
        payload,
        isCommandPayload: isCommandPayload(payload),
        context: 'CastingClient',
        action: 'process_message',
      }, 'Invalid command payload structure');
      return;
    }

    const commandType = payload.type;

    this.logger.log(
      `[Casting] Processing relay command: type=${commandType}, req_id=${(payload as any).req_id || 'none'}`
    );

    // Emit command event
    this.emit('command', payload);
  }

  /**
   * Set status and emit event
   */
  private setStatus(status: CastingStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status', status);
    }
  }

  /**
   * Wait for socket to open
   */
  /* istanbul ignore next */
  private waitForOpen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.transport.isConnected()) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.transport.off('open', onOpen);
        this.transport.off('error', onError);
        reject(new Error('Connection timeout'));
      }, 10000);

      const onOpen = () => {
        clearTimeout(timeout);
        this.transport.off('error', onError);
        resolve();
      };

      const onError = (data: any) => {
        clearTimeout(timeout);
        this.transport.off('open', onOpen);
        reject(new Error(data.error || 'Connection error'));
      };

      this.transport.on('open', onOpen);
      this.transport.on('error', onError);
    });
  }

  /**
   * Emit event to subscribers
   */
  private emit<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          /* istanbul ignore next */
          this.logger.error(`Error in event handler for ${event}`, error as Error);
        }
      });
    }
  }
}

