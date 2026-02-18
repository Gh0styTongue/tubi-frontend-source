import React, { useEffect, useRef } from 'react';

import { TRACK_LOGGING } from 'common/constants/error-types';

import type { Impression } from './ImpressionsManager';
import { ImpressionsManager } from './ImpressionsManager';
import { trackLogging } from '../../utils/track';

export class ImpressionObserver {

  private observer: IntersectionObserver | undefined;

  private elemToImpressionMap = new Map<Element, Impression>();

  private static instance: ImpressionObserver;

  static getInstance() {
    if (!ImpressionObserver.instance) {
      ImpressionObserver.instance = new ImpressionObserver();
    }
    return ImpressionObserver.instance;
  }

  constructor() {
    try {
      this.observer = new IntersectionObserver(entries => {
        const { startEntries, endEntries } = entries.reduce((acc, entry) => {
          const { target, intersectionRatio } = entry;
          const impression = this.elemToImpressionMap.get(target);
          /* istanbul ignore else */
          if (impression) {
            if (intersectionRatio >= 1) acc.startEntries.push(impression);
            else acc.endEntries.push(impression);
          }
          return acc;
        }, { startEntries: [] as Impression[], endEntries: [] as Impression[] });
        const manager = ImpressionsManager.getInstance();
        if (manager && startEntries.length > 0) manager.trackStart(...startEntries);
        if (manager && endEntries.length > 0) manager.trackEnd(...endEntries);
      }, {
        ...(__WEBPLATFORM__ ? {} : { root: document.body }),
        threshold: 1.0,
      });
    } catch (error) {
      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: 'intersectionObserverCreationFailed',
        message: {
          errorMessage: error.message,
        },
      });
    }
  }

  registerTile(target: Element, impression: Impression) {
    this.elemToImpressionMap.set(target, impression);
    this.observer?.observe(target);
  }

  unregisterTile(target: Element) {
    const managerInstance = ImpressionsManager.getInstance();
    const impression = this.elemToImpressionMap.get(target);
    /* istanbul ignore else */
    if (impression && managerInstance) managerInstance.trackEnd(impression);
    this.observer?.unobserve(target);
    this.elemToImpressionMap.delete(target);
    if (this.elemToImpressionMap.size < 1 && managerInstance) managerInstance.processTick();
  }
}

type ImpressionTileProps = {
  contentId: string;
  containerId: string;
  row: number;
  col: number;
  personalizationId: string;
  isSeries?: boolean;
};

export function useImpressionTile({
  contentId,
  containerId,
  row,
  col,
  personalizationId,
  isSeries,
}: ImpressionTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const instance = ImpressionObserver.getInstance();
    if (element) {
      instance.registerTile(element, {
        contentId,
        containerId,
        row,
        col,
        personalizationId,
        isSeries,
      });
      return () => instance.unregisterTile(element);
    }
  }, [contentId, containerId, row, col, isSeries, personalizationId]);

  return ref;
}

export const ImpressionTile: React.FC<ImpressionTileProps & { children?: React.ReactNode; className?: string; }> = ({ children, className, ...props }) => {
  const ref = useImpressionTile(props);
  return (<div ref={ref} data-test-id="impression-tile" className={className}>{children}</div>);
};
