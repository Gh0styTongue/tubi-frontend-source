import classNames from 'classnames';
import type { FC } from 'react';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import styles from './FixedBanner.scss';
import { removeFixedBanner } from '../../actions/fixedBanner';
import useFixedBanner from '../../hooks/useFixedBanner';
import type { FixedBannerButton } from '../../types/fixedBanner';

const BannerButton: FC<{ button: FixedBannerButton }> = ({ button }) => {
  const dispatch = useDispatch();
  const { action, title, primary } = button;
  const buttonClass = classNames(styles.button, { [styles.primaryButton]: primary });
  const close = useCallback(() => {
    dispatch(removeFixedBanner());
  }, [dispatch]);
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (action) action(event);
    close(); // every button will close the banner
  }, [action, close]);

  return <button className={buttonClass} onClick={handleClick}>{title}</button>;
};

const FixedBanner: FC = () => {
  const fixedBanner = useFixedBanner();
  if (!fixedBanner) return null;

  const { buttons, description, title } = fixedBanner;

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
            return <BannerButton key={idx} button={button} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default FixedBanner;
