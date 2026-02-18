import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';

import styles from './IconTextButton.scss';

export type IconTextButtonProps = {
  className?: string;
  onClick?: () => void;
  targetBlank?: boolean;
  text: string;
  to?: string;
};

const IconTextButton: React.FunctionComponent<React.PropsWithChildren<IconTextButtonProps>> = (props) => {
  const { children, className, onClick, targetBlank, text, to } = props;

  const handleClick = () => {
    if (typeof onClick === 'function') onClick();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const buttonClass = classNames(
    styles.listButton,
    { [styles.link]: typeof to === 'string' },
    className,
  );

  const content = text.length ? <span className={styles.text}>{text}</span> : null;

  return to ? (
    <ATag className={buttonClass} to={to} onClick={handleClick} target={targetBlank ? '_blank' : undefined}>
      {children}
      {content}
    </ATag>
  ) : (
    <div
      className={buttonClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      {content}
    </div>
  );
};

export default IconTextButton;
