import React, { useCallback, useEffect, useRef } from 'react';

import useDisableBodyScroll from './useDisableBodyScroll';
import usePortal from './usePortal';

export type Options = {
  id?: string;
  isCloseOnEscape?: boolean;
  isDefaultOpen?: boolean;
  isDisableBodyScroll?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  tagName?: keyof HTMLElementTagNameMap | string;
  target?: HTMLElement | string | null;
};

type Return = {
  closeModal: () => void;
  isOpen: boolean;
  openModal: () => void;
  Modal: React.FunctionComponent<React.PropsWithChildren>;
  toggleModal: () => void;
};

const useModal = ({
  id,
  isCloseOnEscape = true,
  isDefaultOpen = false,
  isDisableBodyScroll = true,
  onClose,
  onOpen,
  tagName = 'div',
  target,
}: Options): Return => {
  const isSsr = useRef(typeof window === 'undefined');

  const { closePortal, openPortal, isOpen, Portal, togglePortal } = usePortal({
    id,
    isDefaultOpen,
    onClose,
    onOpen,
    tagName,
    target,
  });

  // apis
  const closeModal = useCallback(() => {
    closePortal();
  }, [closePortal]);

  const openModal = useCallback(() => {
    openPortal();
  }, [openPortal]);

  const toggleModal = useCallback(() => {
    togglePortal();
  }, [togglePortal]);

  const Modal: React.FunctionComponent<React.PropsWithChildren> = useCallback(
    ({ children }) => {
      return <Portal>{children}</Portal>;
    },

    [Portal],
  );

  // to disable body scroll
  useDisableBodyScroll(isDisableBodyScroll && isOpen);

  // mount & unmount modal
  const handleCloseOnEscape = useCallback(
    (event: KeyboardEvent) => {
      const { key, keyCode } = event;
      if (key === 'Escape' || keyCode === 27) {
        closeModal();
      }
    },
    [closeModal],
  );

  useEffect(() => {
    /* istanbul ignore next */
    if (isSsr.current) {
      return;
    }

    if (isCloseOnEscape) {
      document.addEventListener('keydown', handleCloseOnEscape);
    }

    return () => {
      if (isCloseOnEscape) {
        document.removeEventListener('keydown', handleCloseOnEscape);
      }
    };
  }, [handleCloseOnEscape, isCloseOnEscape]);

  return {
    closeModal,
    isOpen,
    openModal,
    Modal,
    toggleModal,
  };
};

export default useModal;
