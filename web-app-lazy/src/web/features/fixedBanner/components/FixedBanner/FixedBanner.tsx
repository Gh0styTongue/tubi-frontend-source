import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { useDispatch } from 'react-redux';

import styles from './FixedBanner.scss';
import { removeFixedBanner } from '../../actions/fixedBanner';
import useFixedBanner from '../../hooks/useFixedBanner';
import type { FixedBannerButton } from '../../types/fixedBanner';

const FixedBanner: FC = () => {
  const dispatch = useDispatch();
  const fixedBanner = useFixedBanner();
  if (!fixedBanner) return null;

  const { buttons, description, title } = fixedBanner;

  const close = () => {
    dispatch(removeFixedBanner());
  };

  const handleClick = (idx: number, event: React.MouseEvent) => {
    const buttonClicked = buttons[idx];
    const { action } = buttonClicked;
    if (action) action(event);
    close(); // every button will close the banner
  };

  return (
    <div className={styles.fixedBanner}>
      <div className={styles.innerContainer}>
        <div className={styles.main}>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </div>
        <div className={styles.buttons}>
          {buttons.map((button: FixedBannerButton, idx: number) => {
            if (idx >= 2) return null; // no more than two buttons
            const buttonClass = classNames(styles.button, { [styles.primaryButton]: button.primary });
            return <button key={idx} className={buttonClass} onClick={handleClick.bind(null, idx)}>{button.title}</button>;
          })}
        </div>
      </div>
    </div>
  );
};

export default FixedBanner;
