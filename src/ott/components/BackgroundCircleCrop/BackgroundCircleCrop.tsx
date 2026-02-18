import classnames from 'classnames';
import type { FC, PropsWithChildren } from 'react';
import React, { useEffect, useMemo } from 'react';

import RabbitHoleBackground from 'common/components/uilib/SvgLibrary/RabbitHoleBackground';
import { wrapperCustomSelector } from 'common/features/wrapper/selector';
import useAppSelector from 'common/hooks/useAppSelector';
import { isSamsungBefore2020 } from 'common/utils/tizenTools';
import { useShouldShowWrapper, useIsSpotlightEnabled, useIsHdcAdRowActive } from 'ott/containers/Home/hooks';

import styles from './BackgroundCircleCrop.scss';

export interface BackgroundCircleCropProps {
  className?: string;
  fullscreen?: boolean;
  showBrandBg?: boolean;
  myStuff?: boolean;
  backgroundImage?: string;
  /**
   * The background image with the rabbit hole for platforms that do not support SVG.
   */
  backgroundImageFallback?: string;
  hidden?: boolean;
  onMount?: () => void;
  isVideoTile?: boolean;
}

const BackgroundCircleCrop: FC<PropsWithChildren<BackgroundCircleCropProps>> = ({
  children,
  className,
  showBrandBg,
  fullscreen = false,
  myStuff,
  backgroundImage,
  backgroundImageFallback,
  hidden,
  onMount,
  isVideoTile,
}) => {
  useEffect(() => onMount?.(), [onMount]);
  const brandBg = showBrandBg ? <div className={styles.brandBg} /> : null;
  const myStuffImg = myStuff ? <div className={styles.myStuff} /> : null;
  const isSpotlight = useIsSpotlightEnabled();
  // SVG does not work on some older Samsung devices, or LGTV
  const isPlatformSupportSVG = useMemo(
    () =>
      !isSamsungBefore2020() && __OTTPLATFORM__ !== 'LGTV' && __OTTPLATFORM__ !== 'PS5' && __OTTPLATFORM__ !== 'PS4' && !__IS_COMCAST_PLATFORM_FAMILY__ && __OTTPLATFORM__ !== 'DIRECTVHOSP',
    []
  );
  const shouldShowRabbitHoleBackground = !isSpotlight && !hidden && !fullscreen;

  const shouldShowWrapper = useShouldShowWrapper();
  const wrapperCustom = useAppSelector(wrapperCustomSelector);
  const gradientBrandStops = useMemo(() => {
    return shouldShowWrapper && wrapperCustom?.color ? [{}, { color: wrapperCustom.color }] : undefined;
  }, [shouldShowWrapper, wrapperCustom]);
  const isHdcAdRowActive = useIsHdcAdRowActive();

  return (
    <>
      {children}
      {(isVideoTile || isHdcAdRowActive) ? null : (
        <div
          className={classnames(styles.background, className, {
            [styles.imageRabbitHole]: shouldShowRabbitHoleBackground && !isPlatformSupportSVG,
            [styles.hidden]: (hidden && !isSpotlight) || backgroundImageFallback, // if the background image fallback is set, we want to hide the background set with ::after
            [styles.fullscreen]: fullscreen && !isSpotlight,
            [styles.spotlight]: isSpotlight,
          })}
        >
          {brandBg}
          {myStuffImg}
          {
            shouldShowRabbitHoleBackground && isPlatformSupportSVG
              ? <RabbitHoleBackground gradientBrandStops={gradientBrandStops} backgroundImage={backgroundImage} />
              : backgroundImageFallback ? <div className={styles.backgroundImageFallback} style={{ backgroundImage: `url(${backgroundImageFallback})` }} />
                : null
          }
        </div>
      )}
    </>
  );
};

export default BackgroundCircleCrop;
