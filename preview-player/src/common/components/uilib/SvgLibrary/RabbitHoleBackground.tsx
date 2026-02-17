import React, { memo } from 'react';

import styles from './SvgLibrary.scss';

type GradientBrandStops = {
  color?: string;
  position?: string;
};

type Props = {
  gradientBrandStops?: GradientBrandStops[];
};

const RabbitHoleBackground = ({
  gradientBrandStops = [],
}: Props) => {
  const gradientPrimaryStopProps = {
    offset: gradientBrandStops[0]?.position || '0.2',
    stopColor: gradientBrandStops[0]?.color,
    className: gradientBrandStops[0]?.color ? undefined : styles.primary,
  };
  const gradientBrandStopProps = {
    offset: gradientBrandStops[1]?.position || '1',
    stopColor: gradientBrandStops[1]?.color,
    className: gradientBrandStops[1]?.color ? undefined : styles.brand,
  };
  return <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.rabbitHole}>
    <title>Rabbit Hole Background</title>
    <rect opacity="0.8" width="1120" height="746" x="800" fill="url(#paint0_linear_1430_1530)" />
    <path fillRule="evenodd" clipRule="evenodd" d="M896.508 0H0V1080H1062.86C899.93 907.96 800 675.65 800 420C800 269.381 834.687 126.864 896.508 0Z" fill="url(#paint0_linear_1430_1531)" />
    <rect width="1920" height="1080" fill="url(#paint0_linear_1430_1534)" />
    <defs>
      <linearGradient id="paint0_linear_1430_1530" x1="800" x2="1920" y1="373" y2="373" gradientUnits="userSpaceOnUse">
        <stop offset="0" className={styles.primary} />
        <stop offset="0.45" className={styles.transparent50} />
        <stop offset="1" className={styles.transparent0} />
      </linearGradient>
      <linearGradient id="paint0_linear_1430_1531" x1="960" y1="1080" x2="915.942" y2="1.80034" gradientUnits="userSpaceOnUse">
        <stop {...gradientPrimaryStopProps} />
        <stop {...gradientBrandStopProps} />
      </linearGradient>
      <linearGradient id="paint0_linear_1430_1534" x1="960" y1="1080" x2="960" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0.2" className={styles.primary} />
        <stop offset="0.36" className={styles.primary} />
        <stop offset="0.68" className={styles.transparent0} />
      </linearGradient>
    </defs>
  </svg>;
};

export default memo(RabbitHoleBackground);
