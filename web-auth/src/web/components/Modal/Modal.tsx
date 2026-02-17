import classNames from 'classnames';
import React, { forwardRef } from 'react';

import styles from './Modal.scss';

interface ModalProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * let children handle closing the modal
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(({ className: cls, children }, ref) => {
  const modalCls = classNames(styles.modal, cls);
  // key is require by ReactCSSAnimationGroup in App.js
  return (
    <div ref={ref} className={modalCls} key="modal">
      {children}
    </div>
  );
});

export default Modal;
