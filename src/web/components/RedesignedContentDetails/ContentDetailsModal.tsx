import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { DialogAction, DialogType } from '@tubitv/analytics/lib/dialog';
import { Close } from '@tubitv/icons';
import React, { useCallback, useEffect, useRef } from 'react';

import { toggleContentDetailsModal } from 'common/actions/webUI';
import { CONTENT_DETAILS_MODAL_ID } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import { webKeys } from 'common/constants/key-map';
import { useLocation } from 'common/context/ReactRouterModernContext';
import WebDetailsPageRedesign from 'common/experiments/config/webDetailsPageRedesign';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useExperiment from 'common/hooks/useExperiment';
import { buildDialogEvent } from 'common/utils/analytics';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import Overlay from 'web/components/Overlay/Overlay';

import ContentDetails from './ContentDetails';
import styles from './ContentDetailsModal.scss';

const ContentDetailsModal = () => {
  const dispatch = useAppDispatch();
  const modalRef = useRef<HTMLDivElement>(null);
  const location = useLocation<{ [CONTENT_DETAILS_MODAL_ID]: string }>();
  const { [CONTENT_DETAILS_MODAL_ID]: contentId, ...restQuery } = location.query;
  const webDetailsPageRedesign = useExperiment(WebDetailsPageRedesign);
  const isNewDesignEnabled = webDetailsPageRedesign.getValue();

  const onClose = useCallback(() => {
    // Remove the CONTENT_DETAILS_MODAL_ID from the query
    tubiHistory.replace({
      ...location,
      query: restQuery,
    });
  }, [location, restQuery]);

  useEffect(() => {
    if (!isNewDesignEnabled) return;

    if (contentId) {
      const dialogEvent = buildDialogEvent(
        getCurrentPathname(),
        DialogType.INFORMATION,
        ANALYTICS_COMPONENTS.genericComponent,
        DialogAction.SHOW,
        { video_id: Number(contentId) }
      );
      trackEvent(eventTypes.DIALOG, dialogEvent);
    }
  }, [contentId, isNewDesignEnabled]);

  useEffect(() => {
    if (!isNewDesignEnabled) return;

    const keyboardHandler = (e: KeyboardEvent) => {
      if (e.keyCode === webKeys.escape) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (contentId) {
      addEventListener(document, 'keydown', keyboardHandler);
    }

    return () => {
      if (contentId) {
        removeEventListener(document, 'keydown', keyboardHandler);
      }
    };
  }, [onClose, contentId, isNewDesignEnabled]);

  useEffect(() => {
    if (contentId && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [contentId]);

  useEffect(() => {
    dispatch(toggleContentDetailsModal({ isOpen: !!contentId, contentId }));
  }, [contentId, dispatch]);

  if (!isNewDesignEnabled) {
    return null;
  }

  return (
    <Overlay isOpen={(!!contentId)} onClickOverlay={onClose} nodeRef={modalRef}>
      <div
        data-test-id="content-details-modal"
        ref={modalRef}
        className={styles.modalOverlay}
      >
        {!!contentId && (
          <ContentDetails contentId={contentId} cls={styles.contentDetailsModal} layout="in-modal">
            <div className={styles.closeButton}>
              <Close onClick={onClose} />
            </div>
          </ContentDetails>
        )}
      </div>
    </Overlay>
  );
};

export default ContentDetailsModal;
