import type { Player } from '@adrise/player';
import { EventEmitter } from 'events';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useRef } from 'react';

import type { LivePlayerManagers, LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { PlayerManagers } from 'client/features/playback/tubiPlayer';

const ON_PLAYER_CREATE_EVENT = 'onPlayerCreate';
const ON_LIVE_PLAYER_CREATE_EVENT = 'onLivePlayerCreate';

type PlayerCreateCallback = (player: Player, managers: PlayerManagers) => void;
type LivePlayerCreateCallback = (player: LivePlayerWrapper, managers: LivePlayerManagers) => void;

/**
 * This context is intended to be provided to the React render tree on any
 * route in the application which might render a video player. It is intended
 * to allow context consumers to access the player (and subscribe to player
 * creation) without prop-drilling or re-rendering.
 */
export class PlayerContext {
  private emitter = new EventEmitter();

  player?: Player;

  managers: PlayerManagers = {};

  livePlayer?: LivePlayerWrapper;

  liveManagers: LivePlayerManagers = {};

  injectPlayer(player: Player, managers: PlayerManagers): void {
    this.player = player;
    this.managers = managers;
    this.emitter.emit(ON_PLAYER_CREATE_EVENT, player, managers);
  }

  onPlayerCreate(callback: PlayerCreateCallback): void {
    this.emitter.on(ON_PLAYER_CREATE_EVENT, callback);
  }

  onPlayerCreateOnce(callback: PlayerCreateCallback): void {
    this.emitter.once(ON_PLAYER_CREATE_EVENT, callback);
  }

  offPlayerCreate(callback: PlayerCreateCallback): void {
    this.emitter.off(ON_PLAYER_CREATE_EVENT, callback);
  }

  injectLivePlayer(player: LivePlayerWrapper, managers: LivePlayerManagers): void {
    this.livePlayer = player;
    this.liveManagers = managers;
    this.emitter.emit(ON_LIVE_PLAYER_CREATE_EVENT, player, managers);
  }

  onLivePlayerCreate(callback: LivePlayerCreateCallback): void {
    this.emitter.on(ON_LIVE_PLAYER_CREATE_EVENT, callback);
  }

  onLivePlayerCreateOnce(callback: LivePlayerCreateCallback): void {
    this.emitter.once(ON_LIVE_PLAYER_CREATE_EVENT, callback);
  }

  offLivePlayerCreate(callback: LivePlayerCreateCallback): void {
    this.emitter.off(ON_LIVE_PLAYER_CREATE_EVENT, callback);
  }

  // Useful for debugging and testing
  getVODCallbackCount(): number {
    return this.emitter.listenerCount(ON_PLAYER_CREATE_EVENT);
  }

  getLiveCallbackCount(): number {
    return this.emitter.listenerCount(ON_LIVE_PLAYER_CREATE_EVENT);
  }
}

type VideoPlayerContext = React.Context<PlayerContext>;
let cachedVideoPlayerContext: VideoPlayerContext | undefined;

// Avoids creating player context via self-execution on file import
function getVideoPlayerContext(): VideoPlayerContext {
  if (!cachedVideoPlayerContext) {
    cachedVideoPlayerContext = createContext<PlayerContext>(new PlayerContext());
  }
  return cachedVideoPlayerContext;
}

interface VideoPlayerProviderProps {
  children: ReactNode;
  // Context can be injected for testing purposes
  playerContextInstance?: PlayerContext;
}

export const VideoPlayerProvider = ({ children, playerContextInstance }: VideoPlayerProviderProps) => {
  const playerContextRef = useRef(playerContextInstance || new PlayerContext());
  const ctx = getVideoPlayerContext();
  return (
    <ctx.Provider value={playerContextRef.current}>
      {children}
    </ctx.Provider>
  );
};

export const usePlayerContext = (): PlayerContext => useContext(getVideoPlayerContext());
