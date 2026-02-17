import classNames from 'classnames';
import React from 'react';

import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

import styles from './CircularProgressBar.scss';

/**
 * have a circle symbol to simulate progress of ad in circular motion.
 */
const HalfCircleSvgIcon: React.FC = React.memo(() => (
  <SvgIcon viewBox="0 0 1 86" className={styles.halfCircleSvg} role="img">
    {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for SVGs */}
    <title>Circular Progress Bar</title>
    <path d="M0 0v6c20.4 0 37 16.6 37 37S20.4 80 0 80v6c23.7 0 43-19.3 43-43S23.7 0 0 0z" />
  </SvgIcon>
));

/**
 * ads timer countdown,
 * the parent component will be responsible for the calculation of progress.
 */
interface Props {
  className?: string;
  innerText?: string;
  progress: number;
}

const CircularProgressBar: React.FC<Props> = (props) => {
  const { innerText, progress = 0 } = props;

  const className = classNames(styles.progressContainer, { [styles.web]: !__ISOTT__ }, props.className);

  return (
    <div className={className}>
      <div className={styles.rightHalfCircle}>
        <div className={styles.svgContainer} style={getRightHalfCircleStyle(progress)}>
          <HalfCircleSvgIcon />
        </div>
      </div>
      {progress < 0.5 ? null : (
        <div className={styles.leftHalfCircle}>
          <div className={styles.svgContainer} style={getLeftHalfCircleStyle(progress)}>
            <HalfCircleSvgIcon />
          </div>
        </div>
      )}
      <div className={styles.innerCircle}>
        {innerText ? <span className={styles.innerCircleText}>{innerText}</span> : null}
      </div>
    </div>
  );
};

export default CircularProgressBar;

export function getLeftHalfCircleStyle(progress: number): React.CSSProperties {
  const rotation = Math.floor(180 * ((progress - 0.5) / 0.5));

  // rotate 0deg - 180deg from progress 50% to 100%
  return { transform: `rotate(${rotation}deg)` };
}

export function getRightHalfCircleStyle(progress: number): React.CSSProperties {
  if (progress === 0) {
    return { transform: 'rotate(185deg)' };
  }

  if (progress >= 0.49) {
    return { transform: 'rotate(360deg)' };
  }

  // rotate 175deg to 360deg from progress 0% to 51%
  const rotation = Math.floor(185 + 175 * (progress / 0.51));
  return { transform: `rotate(${rotation}deg)` };
}
