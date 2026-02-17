import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Options = {
  isDefaultOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  target?: HTMLElement | string | null;
  id?: string;
  tagName?: keyof HTMLElementTagNameMap | string;
};

type Return = {
  closePortal: () => void;
  isOpen: boolean;
  openPortal: () => void;
  Portal: React.FunctionComponent<React.PropsWithChildren>;
  togglePortal: () => void;
};

const usePortal = ({ id, isDefaultOpen = false, onClose, onOpen, tagName = 'div', target }: Options): Return => {
  const isSsr = useRef(typeof window === 'undefined');

  // mount node
  const mountNode: HTMLElement | null = useMemo(() => {
    /* istanbul ignore next */
    if (isSsr.current) {
      return null;
    }

    if (target instanceof HTMLElement) {
      return target;
    }

    if (typeof target === 'string') {
      return document.getElementById(target);
    }

    return document.body;
  }, [target]);

  // container for being injected into mountNode, used in `createPortal()`
  const container: HTMLElement | null = useMemo(() => {
    /* istanbul ignore next */
    if (isSsr.current) {
      return null;
    }

    const element = document.createElement(tagName);

    if (id) {
      element.setAttribute('id', id);
    }

    return element;
  }, [id, tagName]);

  // use this "isOpen" in callback functions
  const [isOpen, setOpen] = useState(isDefaultOpen);

  // apis
  const closePortal = useCallback(() => {
    if (isOpen) {
      if (onClose) onClose();
      setOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const openPortal = useCallback(() => {
    if (!isOpen) {
      if (onOpen) onOpen();
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const togglePortal = useCallback(() => {
    if (isOpen) {
      closePortal();
    } else {
      openPortal();
    }
  }, [closePortal, isOpen, openPortal]);

  const Portal: React.FunctionComponent<React.PropsWithChildren> = useCallback(
    ({ children }) => {
      return container && isOpen ? createPortal(children, container) : null;
    },
    [container, isOpen],
  );

  // mount & unmount portal
  useEffect(() => {
    /* istanbul ignore next */
    if (isSsr.current) {
      return;
    }

    /* istanbul ignore next */
    if (!(mountNode instanceof HTMLElement) || !(container instanceof HTMLElement)) {
      return;
    }

    mountNode.appendChild(container);

    return () => {
      mountNode.removeChild(container);
    };
  }, [container, mountNode]);

  return {
    closePortal,
    isOpen,
    openPortal,
    Portal,
    togglePortal,
  };
};

export default usePortal;
