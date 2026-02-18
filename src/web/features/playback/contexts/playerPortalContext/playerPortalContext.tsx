import { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

import type { HtmlPortalNode } from 'common/components/ReversePortal/ReversePortal';
import { createHtmlPortalNode, InPortal } from 'common/components/ReversePortal/ReversePortal';
import { useGetLivePlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetLivePlayerInstance';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { useOnDecoupledLivePlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnDecoupledLivePlayerCreate';
import { useOnDecoupledPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnDecoupledPlayerCreate';
import useLatest from 'common/hooks/useLatest';

/**
 * This context is used to manage the player portal.
 * It is used to register the content with the player portal
 * and defer rendering the content to the playerPortalContext.
 * It is also used to manage the floating player state, manage
 * the player portal node, portal content, and content id.
 */
interface PlayerPortalContextValue {
  setIsFloating: (isFloating: boolean) => void;
  getPortalElement: () => ReactNode;
  isFloating: boolean;
  getPlayerDisplayMode: () => PlayerDisplayMode;
  registerContent: (id: string, content: ReactNode) => void;
  destroyPlayers: (id?: string) => void;
  playerPortalNode: HtmlPortalNode | undefined;
}

const PlayerPortalContext = createContext<PlayerPortalContextValue | undefined>(undefined);

export const PlayerPortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const { getLivePlayerInstance } = useGetLivePlayerInstance();
  const [isFloating, setIsFloatingState] = useState<boolean>(false);
  const [contentId, setContentId] = useState<string | undefined>();
  const [portalContent, setPortalContent] = useState<ReactNode | null>(null);
  const playerPortalNodeRef = useRef<HtmlPortalNode>();

  useEffect(() => {
    playerPortalNodeRef.current = createHtmlPortalNode();
  }, []);

  const setIsFloating = useCallback((isFloating: boolean) => {
    setIsFloatingState(isFloating);
  }, []);

  const clearContent = useCallback(() => {
    setPortalContent(null);
    setContentId(undefined);
  }, []);

  /**
   * This function is used to destroy the players and report the VOD session end.
   * Providing the id will ensure that the VOD session end is reported for that
   * specific contentId if the handlers are set. If the id is not provided, we will
   * report the VOD session end for the current contentId.
   */
  const destroyPlayers = useCallback(async () => {
    clearContent();

    getLivePlayerInstance()?.destroy();
    await getPlayerInstance()?.remove();
  }, [getPlayerInstance, getLivePlayerInstance, clearContent]);

  // Register content from PlayerPortalWrapper
  /**
   * TODO: Currently, registerContent is called every time the wrapped portalized component
   * props change. We should instead only call registerContent when the component first mounts,
   * and use OutPortal to pass props to the portalized component.
   */
  const registerContent = useCallback(async (id: string, content: ReactNode) => {
    if (contentId !== id) {
      // We pass the previous contentId to destroyPlayers to report the VOD session end
      await destroyPlayers();
      setContentId(id);
    }
    setPortalContent(content);
  }, [destroyPlayers, contentId]);

  const isFloatingRef = useLatest(isFloating);
  const getPlayerDisplayMode = useCallback(() => {
    return isFloatingRef.current ? PlayerDisplayMode.IN_APP_PICTURE_IN_PICTURE : PlayerDisplayMode.DEFAULT;
  }, [isFloatingRef]);

  const onPlayerDestroy = useCallback(() => () => {
    setIsFloatingState(false);
  }, []);

  useOnDecoupledPlayerCreate(onPlayerDestroy);

  useOnDecoupledLivePlayerCreate(onPlayerDestroy);

  // This is called by FloatingPlayerContainer to render the portal
  const getPortalElement = useCallback(() => {
    if (!playerPortalNodeRef.current) {
      return null;
    }

    return (
      <InPortal node={playerPortalNodeRef.current}>
        {portalContent}
      </InPortal>
    );
  }, [portalContent, playerPortalNodeRef]);

  const contextValue: PlayerPortalContextValue = useMemo(() => ({
    setIsFloating,
    getPortalElement,
    getPlayerDisplayMode,
    isFloating,
    registerContent,
    destroyPlayers,
    playerPortalNode: playerPortalNodeRef.current,
  }), [
    setIsFloating,
    registerContent,
    destroyPlayers,
    getPortalElement,
    isFloating,
    getPlayerDisplayMode,
  ]);

  return (
    <PlayerPortalContext.Provider value={contextValue}>
      {children}
    </PlayerPortalContext.Provider>
  );
};

export const usePlayerPortal = () => {
  const context = useContext(PlayerPortalContext);
  if (!context) {
    throw new Error('usePlayerPortal must be used within a PlayerPortalProvider');
  }
  return context;
};
