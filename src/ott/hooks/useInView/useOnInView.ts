import { useEffect } from 'react';

import type { ObserverListener } from './observer';
import { getInViewObserver } from './observer';

/**
 * Accepts a ref to an element and calls `listener(true|false)` when the element is 100% in view or not.
 */
export function useOnInView<T extends HTMLElement>(
  ref: React.RefObject<T>,
  listener: ObserverListener,
  enabled = true,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    return getInViewObserver().observe(element, listener);
  }, [ref, listener, enabled]);
}

