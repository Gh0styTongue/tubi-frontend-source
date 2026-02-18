import classNames from 'classnames';
import type { FC, ReactEventHandler, RefObject } from 'react';
import React, { forwardRef, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { CREATORVERSE_BACKGROUND_FALLBACK_URL, CREATORVERSE_BACKGROUND_URL, FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import HdcAdPlayer from 'common/features/hdcAd/components/HdcAdPlayer';
import { HDC_AD_PLAY_DELAY } from 'common/features/hdcAd/constants';
import { wrapperCustomSelector } from 'common/features/wrapper/selector';
import type { VideoCustomCreatives } from 'common/features/wrapper/type';
import useAppSelector from 'common/hooks/useAppSelector';
import useMinimumDelay from 'common/hooks/useMinimumDelay';
import type { StoreState } from 'common/types/storeState';
import { changeUrlProtocol } from 'common/utils/urlManipulation';
import BackgroundCircleCrop from 'ott/components/BackgroundCircleCrop/BackgroundCircleCrop';
import OTTTransition from 'ott/components/OTTTransition/OTTTransition';
import { useIsHdcAdRowActive, useIsHdcCarouselAdRowActive, useIsSpotlightEnabled, useShouldShowWrapper } from 'ott/containers/Home/hooks';
import { homeActiveContainerIdSelector } from 'ott/containers/Home/selectors';
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
  isCreatorverseBg?: boolean;
  isFidelityLevelLow: boolean;
  onImageLoad?: ReactEventHandler<HTMLImageElement>;
  onImageVisibilityChange?: (visible: boolean) => void;
  isPreviewPlayerOverlay?: boolean;
  largeVideoPreview?: boolean;
  showBrandBg?: boolean;
  showRepaintMyStuffBg?: boolean;
  // The minimum time in milliseconds that the image should be visible before calling the onImageLoad callback
  minimumImageLoadTime?: number;
  isHdcCarouselAdRowActive?: boolean;
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
  isCreatorverseBg,
  isFidelityLevelLow,
  onImageLoad,
  onImageVisibilityChange,
  isPreviewPlayerOverlay,
  largeVideoPreview,
  showBrandBg,
  showRepaintMyStuffBg,
  minimumImageLoadTime,
  isHdcCarouselAdRowActive,
}) => {
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  const isHdcAdRowActive = useIsHdcAdRowActive();

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
    src: showGeneric ? undefined : isHdcAdRowActive && __DEVELOPMENT__ ? changeUrlProtocol(imageUrl || '', 'https') : imageUrl,
    onLoad,
  };

  const shouldFadeOut = (isPreviewPlayerOverlay && !isFidelityLevelLow)
    || (!ifBgImageMatchActiveContent && !isFidelityLevelLow && !isSponsorshipBg);

  const isSpotlight = useIsSpotlightEnabled();
  const imageCls = classNames(styles.bgImg, {
    [styles.large]: largeVideoPreview && !isSpotlight,
    [styles.fullscreen]: !!fullScreen || isSpotlight,
    [styles.hdcAdRow]: !isSponsorshipBg && isHdcAdRowActive,
    [styles.livePoster]: isLivePoster,
    [styles.fadeOut]: shouldFadeOut,
    [styles.sponsorshipBg]: isSponsorshipBg,
    [styles.slowDevice]: isFidelityLevelLow,
  });

  const ref = useRef<HTMLDivElement | HTMLImageElement>(null);

  // I don't want to break the original transition logic,
  // so I'm using the TransitionGroup and CSSTransition for the HDC Carousel Ad row
  if (isHdcCarouselAdRowActive && useTransition) {
    const currentImage = showGeneric
      ? <div className={imageCls} />
      : <img className={imageCls} {...imageProps} />;

    return (
      <TransitionGroup component="div">
        {!initialLoad && (
          <CSSTransition
            key={imageUrl}
            timeout={900}
            appear
            classNames={{
              enter: styles.backgroundEnter,
              enterActive: styles.backgroundEnterActive,
              exit: styles.backgroundLeave,
              exitActive: styles.backgroundLeaveActiveFast,
              appear: styles.backgroundEnter,
              appearActive: styles.backgroundEnterActive,
            }}
          >
            <div>
              {currentImage}
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    );
  }

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
      backgroundImage={isCreatorverseBg ? CREATORVERSE_BACKGROUND_URL : undefined}
      backgroundImageFallback={isCreatorverseBg ? CREATORVERSE_BACKGROUND_FALLBACK_URL : undefined}
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
  isCreatorverseBg?: boolean;
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
  disableCycle?: boolean;
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

export const getNextImageIndex = (imageUrls: string[], prevImageUrl?: string) => {
  if (!prevImageUrl || !imageUrls.length) return 0;
  return (imageUrls.indexOf(prevImageUrl) + 1) % imageUrls.length;
};

// Exported for testing purposes only. This function had to be extracted from
// the OTTBackground component because there's a bug preventing the
// linear-gradient background styles from being read and/or written correctly
// using jsdom.
// See: https://github.com/jsdom/jsdom/issues/2166
// This means none of these work to show/assert the style:
// - element.style.background
// - element.style.cssText
// - element.getAttribute('style')
// - expect(element).toHaveStyle(...)
export const generateWrapperBackgroundStyles = (
  fullScreen: boolean | undefined,
  isSpotlight: boolean,
  shouldShowWrapper: boolean,
  wrapperCustom?: VideoCustomCreatives
): { background: string } | undefined => {
  return fullScreen && !isSpotlight && shouldShowWrapper && wrapperCustom?.color
    ? { background: `linear-gradient(0deg, #0B0019 0%, ${wrapperCustom.color} 100%)` }
    : undefined;
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
  isCreatorverseBg,
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
  disableCycle = false,
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
    const skipCycle = !imageUrls || imageUrls.length <= 1; // Skip cycle if there is only one image
    if ((isFidelityLevelLow && !forceCycle) || skipCycle || disableCycle) return;
    bgInterval = window.setInterval(() => {
      setImageUrl((prevImageUrl: string | undefined) => {
        const nextIndex = getNextImageIndex(imageUrls, prevImageUrl);
        if (onBgCycle) onBgCycle(nextIndex);
        return imageUrls[nextIndex];
      });
    }, BACKGROUND_INTERVAL);

    return () => {
      /* istanbul ignore next */
      if (bgInterval) clearInterval(bgInterval);
    };
  }, [imageUrls, forceCycle, disableCycle, isFidelityLevelLow, onBgCycle]);

  useEffect(() => {
    if (imageUrls && (!imageUrl || imageUrls.indexOf(imageUrl) === -1)) {
      setImageUrl(imageUrls[0]);
      if (onBgCycle) onBgCycle(0);
    }
  }, [imageUrl, imageUrls, onBgCycle]);

  useEffect(() => {
    if (imageUrlIndex !== undefined) {
      setImageUrlWithIndex(imageUrlIndex);
    }
  }, [imageUrlIndex, setImageUrlWithIndex]);

  const isHdcAdRowActive = useIsHdcAdRowActive();
  const isHdcCarouselAdRowActive = useIsHdcCarouselAdRowActive();
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
    [styles.hdcAdRow]: !isSponsorshipBg && isHdcAdRowActive,
  });
  const activeContainerId = useAppSelector(state => homeActiveContainerIdSelector(state, { pathname: location.pathname }));
  const shouldShowHdcAdPlayer = isSpotlight && isHdcCarouselAdRowActive && !isSponsorshipBg;

  const adVideoPlayer = shouldShowHdcAdPlayer ? (
    <div className={styles.adVideoPlayer}>
      <HdcAdPlayer
        containerId={activeContainerId}
        startInMilliSeconds={HDC_AD_PLAY_DELAY}
      />
    </div>
  ) : null;

  const shouldShowWrapper = useShouldShowWrapper();
  const wrapperCustom = useAppSelector(wrapperCustomSelector);
  const wrapperThemeBackgroundStyles = useMemo(() => {
    return generateWrapperBackgroundStyles(fullScreen, isSpotlight, shouldShowWrapper, wrapperCustom);
  }, [shouldShowWrapper, wrapperCustom, isSpotlight, fullScreen]);

  return (
    <div data-test-id="component-ott-background" style={wrapperThemeBackgroundStyles} className={outerCls} ref={ref}>
      {gradientOnly ? null : (
        <>
          <AnimatedBackground
            isHdcCarouselAdRowActive={isHdcCarouselAdRowActive}
            transitionAppear={transitionAppear}
            isFidelityLevelLow={isFidelityLevelLow}
            showGeneric={showGeneric}
            imageUrl={imageUrl}
            fullScreen={fullScreen}
            isKidsModeEnabled={isKidsModeEnabled}
            ifBgImageMatchActiveContent={ifBgImageMatchActiveContent}
            isLivePoster={isLivePoster}
            isSponsorshipBg={isSponsorshipBg}
            isCreatorverseBg={isCreatorverseBg}
            onImageLoad={onImageLoad}
            onImageVisibilityChange={onImageVisibilityChange}
            isPreviewPlayerOverlay={isPreviewPlayerOverlay}
            largeVideoPreview={largeVideoPreview}
            hideBackgroundCircleCrop={hideBackgroundCircleCrop}
            showBrandBg={showBrandBg}
            showRepaintMyStuffBg={showGeneric && showMyStuffBg}
            minimumImageLoadTime={minimumImageLoadTime}
          />
          {adVideoPlayer}
        </>
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
