import { useOnClickOutside } from '@tubitv/web-ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';

interface UseRelatedExpandOptions {
  enableCollapse: boolean;
  shouldShowStickyRelated: boolean;
  isBottomElementInViewport: boolean;
  relatedContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook to handle related content expansion/collapse logic
 * Manages mobile touch interactions, desktop hover interactions, and auto-collapse behavior
 */
export function useRelatedExpand({
  enableCollapse,
  shouldShowStickyRelated,
  isBottomElementInViewport,
  relatedContainerRef,
}: UseRelatedExpandOptions) {
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const [isRelatedExpanded, setIsRelatedExpanded] = useState(false);

  // YMAL Row Expansion Logic
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  // Clear any pending timeouts
  const clearMouseTimeout = useCallback(() => {
    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
      mouseTimeoutRef.current = null;
    }
  }, []);

  // Collapse YMAL row
  const collapseRelated = useCallback(() => {
    setIsRelatedExpanded(false);
  }, []);

  // Mobile touch handlers
  const handleRelatedExpandToggle = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!enableCollapse || isBottomElementInViewport) return;
    if (!isRelatedExpanded) {
      event.preventDefault();
      event.stopPropagation();
      setIsRelatedExpanded(true);
    } else {
      const target = event.target as Element;
      // Check if the tap is on the actual YMAL content area (not just the container)
      if (relatedContainerRef.current?.contains(target)) {
        return;
      }
      collapseRelated();
    }
  }, [enableCollapse, isBottomElementInViewport, isRelatedExpanded, relatedContainerRef, collapseRelated]);

  // Desktop mouse handlers
  const handleRelatedMouseEnter = useCallback(() => {
    if (isScrollingRef.current) return;

    clearMouseTimeout();
    mouseTimeoutRef.current = setTimeout(() => {
      setIsRelatedExpanded(true);
      mouseTimeoutRef.current = null;
    }, 150); // Delay to prevent quick hover expand
  }, [clearMouseTimeout]);

  const handleRelatedMouseLeave = useCallback(() => {
    if (isScrollingRef.current) return;

    clearMouseTimeout();
    mouseTimeoutRef.current = setTimeout(() => {
      collapseRelated();
      mouseTimeoutRef.current = null;
    }, 150); // Delay to prevent quick hover collapse
  }, [clearMouseTimeout, collapseRelated]);

  // Click outside handler for mobile
  const handleClickOutside = useCallback(() => {
    if (isMobile && isRelatedExpanded) {
      collapseRelated();
    }
  }, [isMobile, isRelatedExpanded, collapseRelated]);

  useOnClickOutside(relatedContainerRef, handleClickOutside);

  // Auto-collapse when scrolling past content or when no longer sticky
  const shouldCollapse = isRelatedExpanded && (
    (enableCollapse && isBottomElementInViewport) || !shouldShowStickyRelated
  );

  useEffect(() => {
    if (shouldCollapse) {
      collapseRelated();
    }
  }, [shouldCollapse, collapseRelated]);

  // Scroll detection to prevent hover expansion during scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      isScrollingRef.current = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingRef.current = false;
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      clearMouseTimeout();
    };
  }, [clearMouseTimeout]);

  return {
    isRelatedExpanded,
    handleRelatedExpandToggle,
    handleRelatedMouseEnter,
    handleRelatedMouseLeave,
    handleClickOutside, // Expose for testing
  };
}
