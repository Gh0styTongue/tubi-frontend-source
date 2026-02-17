import classnames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import React, { useEffect, useMemo } from 'react';

import systemApi from 'client/systemApi';
import type PS4SystemApi from 'client/systemApi/ps4';
import RabbitHoleBackground from 'common/components/uilib/SvgLibrary/RabbitHoleBackground';
import { skinsAdCustomSelector } from 'common/features/skinsAd/selector';
import useAppSelector from 'common/hooks/useAppSelector';
import { isSamsungBefore2019 } from 'common/utils/tizenTools';
import { useShouldShowSkinsAd, useIsSpotlightEnabled } from 'ott/containers/Home/hooks';

import styles from './BackgroundCircleCrop.scss';

export interface BackgroundCircleCropProps {
  className?: string;
  fullscreen?: boolean;
  showBrandBg?: boolean;
  myStuff?: boolean;
  hidden?: boolean;
  onMount?: () => void;
}

const BackgroundCircleCrop: FC<PropsWithChildren<BackgroundCircleCropProps>> = ({
  children,
  className,
  showBrandBg,
  fullscreen = false,
  myStuff,
  hidden,
  onMount,
}) => {
  useEffect(() => onMount?.(), [onMount]);
  const brandBg = showBrandBg ? <div className={styles.brandBg} /> : null;
  const myStuffImg = myStuff ? <div className={styles.myStuff} /> : null;
  const isSpotlight = useIsSpotlightEnabled();
  // SVG does not work on some older Samsung devices, LGTV, or PS4 WebMAF 2
  const isPlatformSupportSVG = useMemo(() => !isSamsungBefore2019() && __OTTPLATFORM__ !== 'LGTV' && !(__OTTPLATFORM__ === 'PS4' && !(systemApi as PS4SystemApi).isWebMAF3()), []);
  const shouldShowRabbitHoleBackground = !isSpotlight && !hidden && !fullscreen;

  const shouldShowSkinsAd = useShouldShowSkinsAd();
  const skinsAdCustom = useAppSelector(skinsAdCustomSelector);
  const gradientBrandStops = useMemo(() => {
    return shouldShowSkinsAd && skinsAdCustom?.color ? [{}, { color: skinsAdCustom.color }] : undefined;
  }, [shouldShowSkinsAd, skinsAdCustom]);

  return (
    <div
      className={classnames(styles.background, className, {
        [styles.imageRabbitHole]: shouldShowRabbitHoleBackground && !isPlatformSupportSVG,
        [styles.hidden]: hidden && !isSpotlight,
        [styles.fullscreen]: fullscreen && !isSpotlight,
        [styles.spotlight]: isSpotlight,
      })}
    >
      {brandBg}
      {myStuffImg}
      {children}
      {
        shouldShowRabbitHoleBackground && isPlatformSupportSVG
          ? <RabbitHoleBackground gradientBrandStops={gradientBrandStops} />
          : null
      }
    </div>
  );
};

export default BackgroundCircleCrop;
