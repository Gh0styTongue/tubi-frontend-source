import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

interface UseElementInViewportOptions {
  threshold?: number;
  rootMargin?: string;
  /**
   * Dependencies to trigger re-observation of the element.
   * Useful when the element might be rendered conditionally.
   */
  dependencies?: unknown[];
}

/**
 * Custom hook to detect if an element is in the viewport using Intersection Observer API
 * @param elementRef - React ref object pointing to the element to observe
 * @param options - Intersection Observer options
 * @returns boolean indicating if the element is in viewport
 */
export function useElementInViewport(
  elementRef: RefObject<HTMLElement>,
  options: UseElementInViewportOptions = {}
): boolean {
  const { threshold = 0, rootMargin = '0px', dependencies = [] } = options;
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      setIsInViewport(false);
      return;
    }

    // Check if Intersection Observer is supported
    if (!window.IntersectionObserver) {
      // Fallback for browsers that don't support Intersection Observer
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, ...dependencies]);

  return isInViewport;
}
