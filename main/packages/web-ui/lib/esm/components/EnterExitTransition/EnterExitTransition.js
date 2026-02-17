import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { memo, forwardRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { bemBlock } from '../../utils/bem';
var TRANSITION_DURATION = 300;
var TRANSITION_MID_DURATION = 600;
var STAGGER_DURATION = 150;
var ENTRANCE_TRANSITIONS = {
    slideInUp: 'slide-in-up',
    fadeIn: 'fade-in',
    slideInDown: 'slide-in-down',
    slideInLeft: 'slide-in-left',
    slideInRight: 'slide-in-right',
    slideInMidRight: 'slide-in-mid-right',
    scaleInDown: 'scale-in-down',
    scaleInUp: 'scale-in-up',
    scaleInUpRight: 'scale-in-up-right',
    featuredCarouselNextEnterLeft: 'featured-carousel-next-enter-left',
    featuredCarouselNextEnterRight: 'featured-carousel-next-enter-right',
    featuredCarouselPreviewEnterLeft: 'featured-carousel-preview-enter-left',
    featuredCarouselPreviousEnterLeft: 'featured-carousel-previous-enter-left',
    featuredCarouselPreviousEnterRight: 'featured-carousel-previous-enter-right',
    featuredCarouselFadeIn: 'featured-carousel-fade-in',
    browseMenuDesktop: 'browse-menu-desktop',
    browseMenuTablet: 'browse-menu-tablet',
    browseMenuMobile: 'browse-menu-mobile',
};
var EXIT_TRANSITIONS = {
    slideOutDown: 'slide-out-down',
    fadeOut: 'fade-out',
    slideOutLeft: 'slide-out-left',
    slideOutMidLeft: 'slide-out-mid-left',
    slideOutRight: 'slide-out-right',
    scaleOutUp: 'scale-out-up',
    scaleOutDown: 'scale-out-down',
    scaleOutDownLeft: 'scale-out-down-left',
    featuredCarouselPreviewExitRight: 'featured-carousel-preview-exit-right',
    featuredCarouselPreviousExitLeft: 'featured-carousel-previous-exit-left',
    featuredCarouselPreviewExitLeft: 'featured-carousel-preview-exit-left',
    featuredCarouselPosterExitLeft: 'featured-carousel-poster-exit-left',
    featuredCarouselPosterExitRight: 'featured-carousel-poster-exit-right',
    browseMenuDesktop: 'browse-menu-desktop',
    browseMenuTablet: 'browse-menu-tablet',
    browseMenuMobile: 'browse-menu-mobile',
};
var getTransitionDuration = function (transition) {
    if (transition === 'slideInMidRight' || transition === 'slideOutMidLeft') {
        return TRANSITION_MID_DURATION;
    }
    return TRANSITION_DURATION;
};
var bem = bemBlock('web-enter-exit-transition');
var EnterExitTransition = forwardRef(function (_a, ref) {
    var _b, _c;
    var entranceTransition = _a.entranceTransition, exitTransition = _a.exitTransition, _d = _a.entranceStagger, entranceStagger = _d === void 0 ? 0 : _d, _e = _a.exitStagger, exitStagger = _e === void 0 ? 0 : _e, appear = _a.appear, nodeRef = _a.nodeRef, transitionProps = __rest(_a, ["entranceTransition", "exitTransition", "entranceStagger", "exitStagger", "appear", "nodeRef"]);
    var enterClass = entranceTransition ? bem.modifier("".concat(ENTRANCE_TRANSITIONS[entranceTransition], "-enter")) : '';
    var enterActiveClass = entranceTransition ? bem.modifier("".concat(ENTRANCE_TRANSITIONS[entranceTransition], "-enter-active")) : '';
    var exitClass = exitTransition ? bem.modifier("".concat(EXIT_TRANSITIONS[exitTransition], "-exit")) : '';
    var exitActiveClass = exitTransition ? bem.modifier("".concat(EXIT_TRANSITIONS[exitTransition], "-exit-active")) : '';
    var enterActiveStaggerClass = classNames(enterActiveClass, (_b = {}, _b[bem.modifier("stagger-".concat(entranceStagger))] = entranceStagger > 0, _b));
    var exitActiveStaggerClass = classNames(exitActiveClass, (_c = {}, _c[bem.modifier("stagger-".concat(exitStagger))] = exitStagger > 0, _c));
    return (React.createElement(CSSTransition, __assign({ ref: ref, timeout: {
            enter: entranceTransition ? getTransitionDuration(entranceTransition) + entranceStagger * STAGGER_DURATION : 0,
            exit: exitTransition ? getTransitionDuration(exitTransition) + exitStagger * STAGGER_DURATION : 0,
        }, classNames: {
            enter: enterClass,
            enterActive: enterActiveStaggerClass,
            appear: appear ? enterClass : undefined,
            appearActive: appear ? enterActiveStaggerClass : undefined,
            exit: exitClass,
            exitActive: exitActiveStaggerClass,
        }, appear: true, nodeRef: nodeRef }, transitionProps)));
});
EnterExitTransition.displayName = 'EnterExitTransition';
export default memo(EnterExitTransition);
//# sourceMappingURL=EnterExitTransition.js.map