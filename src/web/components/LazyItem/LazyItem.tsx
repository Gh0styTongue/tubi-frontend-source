import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface LazyItemProps {
  lazy?: boolean;
  minVisibilityRatio?: number;
  rootMargin?: string;
  children: ({ active, ref }: { active: boolean, ref: RefObject<HTMLDivElement> }) => ReturnType<React.FC>;
}

const LazyItem: React.FC<LazyItemProps> = ({
  lazy = true,
  minVisibilityRatio = 0.1,
  rootMargin = '0px',
  children,
}) => {
  const [active, setActive] = useState(!lazy);
  const ref = useRef<HTMLDivElement>(null);

  const createObserver = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const threshold: IntersectionObserverInit['threshold'] = Array.from({ length: 10 }, (_, i) => i / 10); // [0, 0.1, 0.2 ... 0.9]
    const observer = new IntersectionObserver((entries) => {
      setActive(entries.some(entry => entry.intersectionRatio > minVisibilityRatio));
    }, {
      root: null, // watch for changes in visibility of the target element relative to the document's viewport
      rootMargin, // watch with or without any added (or subtracted) space.
      threshold, // when detecting element's visibility ratio crosses one of the thresholds, it calls handleIntersect
    });
    observer.observe(element);

    return observer;
  }, [minVisibilityRatio, rootMargin]);

  useEffect(() => {
    if (!lazy) return;

    let observer = createObserver();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        observer?.disconnect();
        observer = createObserver();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [createObserver, lazy]);

  return children({ active, ref });
};

export default LazyItem;

