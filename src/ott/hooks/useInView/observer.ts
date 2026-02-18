import { exposeToTubiGlobal } from 'client/global';
import { isSupported } from 'client/spatialNavigation/utils';
import { TRACK_LOGGING } from 'common/constants/error-types';
import { StringMap } from 'common/utils/collections';
import { trackLogging } from 'common/utils/track';

import styles from './observer.scss';

export type ObserverListener = (inView: boolean) => void | (VoidFunction);

export class InViewObserver {
  private io?: IntersectionObserver;
  private listenerRegistry = new StringMap<ObserverListener>();
  private cleanupRegistry = new StringMap<VoidFunction>();
  private debugMode = false;
  private idSeq = 0;

  constructor() {
    if (!isSupported('IntersectionObserver')) {
      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: 'intersectionObserverCreationFailed',
        message: {
          errorMessage: 'InViewObserver failed to initialize because IntersectionObserver was not available',
        },
      });
      return;
    }

    exposeToTubiGlobal({
      toggleInViewDebugMode: () => {
        this.debugMode = !this.debugMode;
        if (this.debugMode) {
          document.body.classList.add(styles.inViewDebugMode);
        } else {
          document.body.classList.remove(styles.inViewDebugMode);
        }
      },
    });

    this.io = new IntersectionObserver(
      (entries) => {
        for (const { target, intersectionRatio } of entries) {
          const targetElement = target as HTMLElement;
          const key = targetElement.dataset.observerListenerKey;
          if (!key) continue;
          const isInView = intersectionRatio >= 1;
          targetElement.dataset.inViewTracking = String(isInView);
          this.cleanupRegistry.get(key)?.();
          const cleanup = this.listenerRegistry.get(key)?.(isInView);
          if (cleanup) this.cleanupRegistry.set(key, cleanup);
        }
      },
      {
        ...(__WEBPLATFORM__ ? {} : { root: document.body }),
        threshold: 1.0,
      }
    );
  }

  private newListenerRegistryKey() {
    return `ioListenerKey-${++this.idSeq}`;
  }

  // Observer assume only one listener per element
  observe(el: HTMLElement, listener: ObserverListener) {
    const observer = this.io;
    if (!observer) return;

    const key = this.newListenerRegistryKey();
    el.dataset.observerListenerKey = key;
    this.listenerRegistry.set(key, listener);
    observer.observe(el);

    return () => {
      this.cleanupRegistry.get(key)?.();
      this.cleanupRegistry.delete(key);
      this.listenerRegistry.delete(key);
      observer.unobserve(el);
      delete el.dataset.observerListenerKey;
    };
  }
}

let inViewObserverInstance: InViewObserver | undefined;
export function getInViewObserver() {
  if (!inViewObserverInstance) {
    inViewObserverInstance = new InViewObserver();
  }
  return inViewObserverInstance;
}
