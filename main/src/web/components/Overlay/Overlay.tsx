import type { PropsWithChildren, RefObject } from 'react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CSSTransition } from 'react-transition-group';

import type { Options as UseModalOptions } from 'web/hooks/useModal';
import useModal from 'web/hooks/useModal';

import styles from './Overlay.scss';

type OverlayProps = PropsWithChildren<
  {
    isOpen: boolean;
    onClose?: () => void;
    onClickOverlay?: () => void;
    overlayClassNames?: CSSTransition.CSSTransitionProps['classNames'];
    contentClassNames?: CSSTransition.CSSTransitionProps['classNames'];
    dataNoSnippet?: boolean;
    nodeRef?: RefObject<HTMLElement>;
  } & Partial<UseModalOptions>
>;

const fadeClassNames = {
  appear: styles.fadeAppear,
  appearActive: styles.fadeAppearActive,
  appearDone: styles.fadeAppearDone,
  enter: styles.fadeEnter,
  enterActive: styles.fadeEnterActive,
  enterDone: styles.fadeEnterDone,
  exit: styles.fadeExit,
  exitActive: styles.fadeExitActive,
  exitDone: styles.fadeExitDone,
};

const Overlay: React.FC<OverlayProps> = ({
  isOpen,
  onClose,
  onClickOverlay,
  children,
  overlayClassNames = fadeClassNames,
  contentClassNames = fadeClassNames,
  target: customTarget,
  dataNoSnippet,
  nodeRef,
  ...useModalOptions
}) => {
  const [target, setTarget] = useState<UseModalOptions['target']>(customTarget);

  useEffect(() => {
    if (!target) {
      setTarget(document.getElementById('app'));
    }
  }, [target]);
  const { closeModal, Modal, openModal } = useModal({ isDefaultOpen: isOpen, target, ...useModalOptions });

  // transition control and use count to close modal after transition completed
  const transitionRef = useRef(0);
  const [isTransitionIn, setTransitionIn] = useState(false);

  const handleTransitionEnter = useCallback(() => {
    transitionRef.current++;
  }, []);

  const handleTransitionExited = useCallback(() => {
    transitionRef.current--;
    if (transitionRef.current === 0) {
      if (onClose) {
        onClose();
      }
      closeModal();
    }
  }, [onClose, closeModal]);

  // control modal by "isOpen" props
  useEffect(() => {
    if (isOpen) {
      openModal();
      setTransitionIn(true);
    } else {
      setTransitionIn(false);
    }
  }, [setTransitionIn, closeModal, openModal, isOpen]);

  const overlayNodeRef = useRef<HTMLDivElement>(null);

  return (
    <Modal>
      <div data-test-id="component-overlay" className={styles.root} {...dataNoSnippet ? { 'data-nosnippet': true } : {}}>
        <CSSTransition
          appear
          classNames={overlayClassNames}
          in={isTransitionIn}
          onEnter={handleTransitionEnter}
          onExited={handleTransitionExited}
          timeout={300}
          nodeRef={overlayNodeRef}
        >
          <div ref={overlayNodeRef} className={styles.overlay} onClick={onClickOverlay} />
        </CSSTransition>
        <CSSTransition
          appear
          classNames={contentClassNames}
          in={isTransitionIn}
          onEnter={handleTransitionEnter}
          onExited={handleTransitionExited}
          timeout={300}
          nodeRef={nodeRef}
        >
          {children}
        </CSSTransition>
      </div>
    </Modal>
  );
};

export default Overlay;
