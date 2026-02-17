import classNames from 'classnames';
import React from 'react';

import SvgIcon from 'common/components/uilib/SvgIcon/SvgIcon';

import styles from './Spinner.scss';

interface Props {
  className?: string;
  fullscreen?: boolean;
}

const Spinner: React.FunctionComponent<Props> = ({ className, fullscreen = false, ...restProps }) => {
  const svgClassName = classNames(styles.spinner, className, { [styles.fullscreen]: fullscreen });

  return (
    <SvgIcon className={svgClassName} viewBox="0 0 40 40" {...restProps} role="img">
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for SVGs */}
      <title>Spinner</title>
      <g>
        <defs>
          <linearGradient className={styles.lg1} id="g">
            <stop className={styles.start} offset="0%" />
            <stop className={styles.end} offset="100%" />
          </linearGradient>
          <linearGradient className={styles.lg2} id="rg">
            <stop className={styles.start} offset="0%" />
            <stop className={styles.end} offset="100%" />
          </linearGradient>
        </defs>
        <path className={styles.path} d="M 20 20 m 18, 0 a 18,18 0 1,0 -36,0" stroke="url(#g)" />
        <path className={styles.path} d="M 20 20 m -18, 0 a 18,18 0 1,0 36,0" stroke="url(#rg)" />
        <circle cx="38" cy="20" r="1" fill="currentColor" />
      </g>
    </SvgIcon>
  );
};

export default Spinner;
