import type React from 'react';

import { useIsomorphicLayoutEffect } from 'common/hooks/useIsomorphicLayoutEffect';
import useLatest from 'common/hooks/useLatest';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';

interface PlayerPortalWrapperProps {
  contentId: string;
  children: React.ReactNode;
}

/**
 * This component is used to wrap the children components that need to be rendered in the player portal.
 * It is used to register the content with the player portal context and defer rendering the content to the playerPortalContext.
 */
export const PlayerPortalWrapper: React.FC<PlayerPortalWrapperProps> = ({ children, contentId }) => {
  const { registerContent } = usePlayerPortal();

  const registerContentRef = useLatest(registerContent);

  // Register content when wrapper mounts
  useIsomorphicLayoutEffect(() => {
    // Set timeout is used to ensure we update context state after context consuming components have mounted
    const timeout = setTimeout(() => {
      // Only register content if component is still mounted
      registerContentRef.current(contentId, children);
    }, 0);

    // Cleanup: mark component as unmounted
    return () => {
      clearTimeout(timeout);
    };
  }, [children, registerContentRef, contentId]);

  // We will defer rendering the content to the playerPortalContext
  return null;
};
