import { Close } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useRef } from 'react';

import Overlay from 'web/components/Overlay/Overlay';

import styles from './BaseModal.scss';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
  /** Custom class for the modal container (use for variant styles) */
  modalContainerClassName?: string;
  /** Custom class for the content wrapper */
  modalContentClassName?: string;
  isCloseOnEscape?: boolean;
  isCloseOnOverlayClick?: boolean;
  isDisableBodyScroll?: boolean;
  dataNoSnippet?: boolean;
  children: React.ReactNode;
}

const BaseModal = ({
  isOpen,
  onClose,
  showCloseButton = true,
  modalContainerClassName,
  modalContentClassName,
  isCloseOnEscape = true,
  isCloseOnOverlayClick = true,
  isDisableBodyScroll = true,
  dataNoSnippet,
  children,
}: BaseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const onClickOverlay = useCallback(() => {
    if (isCloseOnOverlayClick) {
      onClose();
    }
  }, [isCloseOnOverlayClick, onClose]);

  const overlayProps = {
    dataNoSnippet,
    isCloseOnEscape,
    // isOpen is required for an edge case when another modal is open after the current modal is closed
    isDisableBodyScroll: isDisableBodyScroll && isOpen,
    isOpen,
    nodeRef: modalRef,
    onClickOverlay,
    // onEscapeClose is separate from onClickOverlay so Escape works even when isCloseOnOverlayClick is false
    onEscapeClose: onClose,
  };

  return (
    <Overlay {...overlayProps}>
      <div ref={modalRef} className={classNames(styles.modal, modalContainerClassName)}>
        {showCloseButton && (
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <Close />
          </button>
        )}
        <div className={classNames(styles.content, modalContentClassName)}>{children}</div>
      </div>
    </Overlay>
  );
};

export default BaseModal;
