import { useInView } from '@tubitv/web-ui';
import debounce from 'lodash/debounce';
import React, { useEffect, useRef, useState } from 'react';

import { getData } from 'client/utils/sessionDataStorage';
import { setAppDownloadModal } from 'common/actions/ui';
import { LD_APP_DOWNLOAD_MODAL_DISMISSED } from 'common/constants/constants';
import { getExperiment, useExperiment, useExperimentUser } from 'common/experimentV2';
import { webottWebMobileFullAppExperienceModal } from 'common/experimentV2/configs/webottWebMobileFullAppExperienceModal';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { showAppDownloadModalSelector } from 'common/selectors/ui';
import { addEventListener, removeEventListener } from 'common/utils/dom';

interface SixthContainerObserverProps {
  children: React.ReactElement;
  isHomePage: boolean;
}

const SixthContainerObserver: React.FC<SixthContainerObserverProps> = ({ children, isHomePage }) => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { refCallback, isInView } = useInView({ rootMargin: '0px', debounceWait: 50 });
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const hasTriggeredRef = useRef(false);
  const scrollHandlerRef = useRef<ReturnType<typeof debounce> | null>(null);
  const positionCheckHandlerRef = useRef<ReturnType<typeof debounce> | null>(null);
  const showAppDownloadModal = useAppSelector(showAppDownloadModalSelector);

  const experimentResult = useExperiment(webottWebMobileFullAppExperienceModal, { disableExposureLog: true });
  const variation = experimentResult.get('variation') as 0 | 1 | 2;
  const experimentUser = useExperimentUser();

  const calculateAndSavePosition = React.useCallback(() => {
    if (!isHomePage || !containerRef.current || hasTriggeredRef.current || savedPosition !== null) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const isVisible = rect.bottom > -100 && rect.top < viewportHeight + 100;

    if (isVisible) {
      const containerTop = rect.top + scrollY;
      setSavedPosition(containerTop);
    }
  }, [isHomePage, savedPosition]);

  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (refCallback) {
      refCallback(node);
    }

    if (node && isHomePage && !hasTriggeredRef.current && savedPosition === null) {
      requestAnimationFrame(() => {
        calculateAndSavePosition();
      });
    }
  }, [refCallback, isHomePage, savedPosition, calculateAndSavePosition]);

  useEffect(() => {
    if (!isHomePage) {
      setSavedPosition(null);
      return;
    }

    if (isInView && containerRef.current && !hasTriggeredRef.current && savedPosition === null) {
      requestAnimationFrame(() => {
        calculateAndSavePosition();
      });
    }
  }, [isInView, isHomePage, savedPosition, calculateAndSavePosition]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      const handler = positionCheckHandlerRef.current;
      if (handler) {
        removeEventListener(window, 'scroll', handler);
        handler.cancel();
        positionCheckHandlerRef.current = null;
      }
    };

    if (!isHomePage || savedPosition !== null || hasTriggeredRef.current || !containerRef.current) {
      return cleanup;
    }

    requestAnimationFrame(() => {
      calculateAndSavePosition();
    });

    const checkPositionOnScroll = () => {
      if (savedPosition !== null || hasTriggeredRef.current) return;
      requestAnimationFrame(() => {
        calculateAndSavePosition();
      });
    };

    positionCheckHandlerRef.current = debounce(checkPositionOnScroll, 10);
    addEventListener(window, 'scroll', positionCheckHandlerRef.current);

    intervalId = setInterval(() => {
      calculateAndSavePosition();
    }, 100);

    return cleanup;
  }, [isHomePage, savedPosition, calculateAndSavePosition]);

  useEffect(() => {
    const cleanup = () => {
      const handler = scrollHandlerRef.current;
      if (handler) {
        removeEventListener(window, 'scroll', handler);
        handler.cancel();
        scrollHandlerRef.current = null;
      }
    };

    if (!isHomePage || savedPosition === null || hasTriggeredRef.current) {
      return cleanup;
    }

    const checkScrollPosition = () => {
      if (showAppDownloadModal) {
        return;
      }

      // Don't show modal if it was previously dismissed in this session
      if (getData(LD_APP_DOWNLOAD_MODAL_DISMISSED)) {
        hasTriggeredRef.current = true;
        return;
      }

      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      if (currentScrollY > savedPosition) {
        if (!hasTriggeredRef.current) {
          const exposureResult = getExperiment(webottWebMobileFullAppExperienceModal, { user: experimentUser });
          exposureResult.get('variation');
          if (variation !== 0) {
            dispatch(setAppDownloadModal(true, variation));
          }
        }
        hasTriggeredRef.current = true;
      }
    };

    scrollHandlerRef.current = debounce(checkScrollPosition, 50);
    addEventListener(window, 'scroll', scrollHandlerRef.current);

    return cleanup;
  }, [savedPosition, isHomePage, dispatch, variation, showAppDownloadModal, experimentUser]);

  useEffect(() => {
    if (!isHomePage) {
      hasTriggeredRef.current = false;
      setSavedPosition(null);
    }
  }, [isHomePage]);

  return (
    <div ref={combinedRef} style={{ position: 'relative' }} className="sixthContainerWrapper">
      {children}
    </div>
  );
};

export default SixthContainerObserver;
