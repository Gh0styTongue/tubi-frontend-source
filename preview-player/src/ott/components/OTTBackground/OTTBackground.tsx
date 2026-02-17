import classNames from 'classnames';
import type { FC, ReactEventHandler, RefObject } from 'react';
import React, { forwardRef, useRef, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import useMinimumDelay from 'common/hooks/useMinimumDelay';
import type { StoreState } from 'common/types/storeState';
import BackgroundCircleCrop from 'ott/components/BackgroundCircleCrop/BackgroundCircleCrop';
import OTTTransition from 'ott/components/OTTTransition/OTTTransition';
import { useIsSpotlightEnabled } from 'ott/containers/Home/hooks';
import { FidelityLevel, isFidelityLevelMatch } from 'ott/utils/uiFidelity';

import styles from './OTTBackground.scss';

export const BACKGROUND_INTERVAL = 5000;
export interface AnimatedBackgroundProps {
  fullScreen?: boolean;
  imageUrl?: string;
  ifBgImageMatchActiveContent?: boolean;
  isKidsModeEnabled?: boolean;
  showGeneric?: boolean;
  hideBackgroundCircleCrop?: boolean;
  transitionAppear?: boolean;
  isLivePoster?: boolean;
  isSponsorshipBg?: boolean;
  isFidelityLevelLow: boolean;
  onImageLoad?: ReactEventHandler<HTMLImageElement>;
  onImageVisibilityChange?: (visible: boolean) => void;
  isPreviewPlayerOverlay?: boolean;
  largeVideoPreview?: boolean;
  showBrandBg?: boolean;
  showRepaintMyStuffBg?: boolean;
  // The minimum time in milliseconds that the image should be visible before calling the onImageLoad callback
  minimumImageLoadTime?: number;
}

const transitionNames = {
  enter: styles.backgroundEnter,
  enterActive: styles.backgroundEnterActive,
  exit: styles.backgroundLeave,
  exitActive: styles.backgroundLeaveActive,
  appear: styles.backgroundEnter,
  appearActive: styles.backgroundEnterActive,
};

/**
 * Extracting the OTTTransition and div to avoid re-renders
 */
export const AnimatedBackground: FC<AnimatedBackgroundProps> = ({
  fullScreen,
  imageUrl,
  ifBgImageMatchActiveContent = true,
  showGeneric,
  hideBackgroundCircleCrop,
  transitionAppear,
  isLivePoster,
  isSponsorshipBg,
  isFidelityLevelLow,
  onImageLoad,
  onImageVisibilityChange,
  isPreviewPlayerOverlay,
  largeVideoPreview,
  showBrandBg,
  showRepaintMyStuffBg,
  minimumImageLoadTime,
}) => {
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  const useTransition = !isFidelityLevelLow && !showGeneric;

  /**
   * If the image load time is less than the minimum image load time,
   * we will wait for the remaining time before calling the onImageLoad callback
   * in order to prevent a sudden flash of the bg image when the image is loaded quickly
   */
  const { markStartTime, triggerCallback } = useMinimumDelay<ReactEventHandler<HTMLImageElement>>(onImageLoad || FREEZED_EMPTY_FUNCTION, minimumImageLoadTime || 0);

  useEffect(() => {
    if (minimumImageLoadTime && imageUrl) {
      markStartTime();
    }
  }, [imageUrl, minimumImageLoadTime, markStartTime]);

  const onLoad: ReactEventHandler<HTMLImageElement> = useCallback((event) => {
    onImageVisibilityChange?.(true);
    triggerCallback(event);
  }, [onImageVisibilityChange, triggerCallback]);

  useEffect(() => () => {
    onImageVisibilityChange?.(false);
  }, [onImageVisibilityChange]);

  const imageProps = {
    src: showGeneric ? undefined : imageUrl,
    onLoad,
  };

  const shouldFadeOut = (isPreviewPlayerOverlay && !isFidelityLevelLow)
    || (!ifBgImageMatchActiveContent && !isFidelityLevelLow && !isSponsorshipBg);

  const isSpotlight = useIsSpotlightEnabled();
  const imageCls = classNames(styles.bgImg, {
    [styles.large]: largeVideoPreview && !isSpotlight,
    [styles.fullscreen]: !!fullScreen || isSpotlight,
    [styles.livePoster]: isLivePoster,
    [styles.fadeOut]: shouldFadeOut,
    [styles.sponsorshipBg]: isSponsorshipBg,
    [styles.slowDevice]: isFidelityLevelLow,
  });

  const ref = useRef<HTMLDivElement | HTMLImageElement>(null);

  const img = imageProps.src ? <img key={imageUrl} ref={ref as RefObject<HTMLImageElement>} className={imageCls} {...imageProps} /> : null;

  const imgOrGenericDiv = showGeneric
    ? <div ref={ref as RefObject<HTMLDivElement>} key={imageUrl} className={imageCls} />
    : img;

  const imgWithTransition = <OTTTransition
    transitionName={transitionNames}
    component="div"
    timeout={900}
    transitionAppear={transitionAppear}
    useTransition={useTransition}
    nodeRef={ref}
  >
    {initialLoad ? null : imgOrGenericDiv}
  </OTTTransition>;

  const showBackgroundCircleCrop = (!isSponsorshipBg && !!img && !hideBackgroundCircleCrop) || showRepaintMyStuffBg || showBrandBg;

  return showBackgroundCircleCrop ?
    <BackgroundCircleCrop
      fullscreen={fullScreen}
      showBrandBg={showBrandBg}
      myStuff={showRepaintMyStuffBg}
    >
      {imgWithTransition}
    </BackgroundCircleCrop>
    : imgWithTransition;
};

export interface OTTBackgroundProps {
  imageUrls?: string[];
  imageUrlIndex?: number;
  blur?: boolean;
  fullScreen?: boolean;
  vibrant?: boolean;
  gradientClass?: string;
  transitionTimer?: number;
  transitionAppear?: boolean;
  forceCycle?: boolean;
  isFidelityLevelLow: boolean;
  gradientOnly?: boolean;
  isLivePoster?: boolean;
  ifBgImageMatchActiveContent?: boolean;
  isKidsModeEnabled?: boolean;
  isSponsorshipBg?: boolean;
  isHigherSponsorshipBg?: boolean;
  showBrandBg?: boolean;
  showMyStuffBg?: boolean;
  hideBackgroundCircleCrop?: boolean;
  onBgCycle?: (index: number) => void;
  onImageLoad?: ReactEventHandler<HTMLImageElement>;
  onImageVisibilityChange?: (visible: boolean) => void;
  isPreviewPlayerOverlay?: boolean;
  largeVideoPreview?: boolean;
  minimumImageLoadTime?: number;
}

interface SetImageUrlWithIndex {
  imageUrl: string | undefined;
  imageUrls?: string[];
  index: number;
  setImageUrl: (url: string) => void;
}

export const genImageUrlSetter = ({ imageUrl, imageUrls, setImageUrl }: Omit<SetImageUrlWithIndex, 'index'>) =>
  (index: number) => {
    const setImageUrlWithIndex = ({ imageUrl, imageUrls, index, setImageUrl }: SetImageUrlWithIndex) => {
      if (!Array.isArray(imageUrls)) return;
      const newImageUrl = imageUrls[index];
      if (newImageUrl && imageUrl !== newImageUrl) {
        setImageUrl(newImageUrl);
      }
    };
    setImageUrlWithIndex({ imageUrl, imageUrls, index, setImageUrl });
  };

let bgInterval: number | undefined;
const OTTBackground = forwardRef<HTMLDivElement, OTTBackgroundProps>(({
  forceCycle = false,
  fullScreen,
  vibrant,
  gradientOnly,
  isLivePoster,
  imageUrlIndex,
  imageUrls,
  isHigherSponsorshipBg,
  isKidsModeEnabled,
  ifBgImageMatchActiveContent,
  isSponsorshipBg,
  onBgCycle,
  transitionAppear,
  isFidelityLevelLow,
  onImageLoad,
  onImageVisibilityChange,
  isPreviewPlayerOverlay,
  showBrandBg,
  showMyStuffBg,
  hideBackgroundCircleCrop,
  largeVideoPreview,
  minimumImageLoadTime,
}, ref) => {
  const imageUrlInitialState = imageUrls && Array.isArray(imageUrls) ? imageUrls[imageUrlIndex || 0] : undefined;
  const [imageUrl, setImageUrl] = useState<string | undefined>(imageUrlInitialState);
  const showGeneric = !imageUrls || imageUrls.length === 0;

  const setImageUrlWithIndex = useCallback(
    (imageUrlIndex: number) => genImageUrlSetter({ imageUrl, imageUrls, setImageUrl })(imageUrlIndex),
    [imageUrls, imageUrl]
  );
  useEffect(() => {
    if (bgInterval) clearInterval(bgInterval);
    if (imageUrls && (!imageUrl || imageUrls.indexOf(imageUrl) === -1)) {
      setImageUrl(imageUrls[0]);
      if (onBgCycle) onBgCycle(0);
    }
    if ((isFidelityLevelLow && !forceCycle) || !imageUrls) return;
    bgInterval = window.setInterval(() => {
      setImageUrl((prevImageUrl: string | undefined) => {
        const nextIndex = prevImageUrl ? (imageUrls.indexOf(prevImageUrl) + 1) % imageUrls.length : 0;
        if (onBgCycle) onBgCycle(nextIndex);
        return imageUrls[nextIndex];
      });
    }, BACKGROUND_INTERVAL);

    return () => {
      /* istanbul ignore next */
      if (bgInterval) clearInterval(bgInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrls, forceCycle]);

  useEffect(() => {
    if (imageUrlIndex !== undefined) {
      setImageUrlWithIndex(imageUrlIndex);
    }
  }, [imageUrlIndex, setImageUrlWithIndex]);
  const isSpotlight = useIsSpotlightEnabled();
  const outerCls = classNames(styles.ottBackground, {
    [styles.generic]: showGeneric && !isPreviewPlayerOverlay,
    [styles.large]: largeVideoPreview,
    [styles.fullscreen]: !!fullScreen || isSpotlight,
    [styles.vibrant]: !!vibrant,
    [styles.liveStyle]: !!isLivePoster,
    [styles.sponsorshipBg]: !!isSponsorshipBg,
    [styles.higherSponsorshipBg]: isHigherSponsorshipBg,
    [styles.myStuffGenericBg]: showGeneric && showMyStuffBg && !isKidsModeEnabled,
    [styles.myStuffKidsModeGenericBg]: showGeneric && showMyStuffBg && isKidsModeEnabled,
    [styles.spotlight]: isSpotlight,
  });

  return (
    <div data-test-id="component-ott-background" className={outerCls} ref={ref}>
      {gradientOnly ? null : (
        <AnimatedBackground
          transitionAppear={transitionAppear}
          isFidelityLevelLow={isFidelityLevelLow}
          showGeneric={showGeneric}
          imageUrl={imageUrl}
          fullScreen={fullScreen}
          isKidsModeEnabled={isKidsModeEnabled}
          ifBgImageMatchActiveContent={ifBgImageMatchActiveContent}
          isLivePoster={isLivePoster}
          isSponsorshipBg={isSponsorshipBg}
          onImageLoad={onImageLoad}
          onImageVisibilityChange={onImageVisibilityChange}
          isPreviewPlayerOverlay={isPreviewPlayerOverlay}
          largeVideoPreview={largeVideoPreview}
          hideBackgroundCircleCrop={hideBackgroundCircleCrop}
          showBrandBg={showBrandBg}
          showRepaintMyStuffBg={showGeneric && showMyStuffBg}
          minimumImageLoadTime={minimumImageLoadTime}
        />
      )}
    </div>
  );
});

export const mapStateToProps = (state: StoreState) => {
  const {
    ui: { isKidsModeEnabled, uiFidelity },
    ottUI: {
      background: { ifBgImageMatchActiveContent },
    },
  } = state;
  const isFidelityLevelLow = !isFidelityLevelMatch(uiFidelity, FidelityLevel.Medium);
  return {
    ifBgImageMatchActiveContent,
    isKidsModeEnabled,
    isFidelityLevelLow,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(OTTBackground);
