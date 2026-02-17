var _a;
import { __assign } from "tslib";
import { useRefMap } from '@adrise/utils/lib/useRefMap';
import classNames from 'classnames';
import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { bemBlock } from '../../utils/bem';
import EnterExitTransition from '../EnterExitTransition/EnterExitTransition';
var TransitionType;
(function (TransitionType) {
    TransitionType["Enter"] = "enter";
    TransitionType["Left"] = "left";
    TransitionType["Right"] = "right";
    TransitionType["Reset"] = "reset";
})(TransitionType || (TransitionType = {}));
var FEATURED_CAROUSEL_TRANSITIONS = (_a = {},
    _a[TransitionType.Enter] = {
        previousPoster: { entranceTransition: undefined, exitTransition: undefined, entranceStagger: 0 },
        poster: { entranceTransition: undefined, exitTransition: undefined, entranceStagger: 0 },
        nextPoster: { entranceTransition: undefined, exitTransition: undefined, entranceStagger: 0 },
        previewPoster: { entranceTransition: undefined, exitTransition: undefined, entranceStagger: 0 },
    },
    _a[TransitionType.Reset] = {
        previousPoster: { entranceTransition: 'featuredCarouselFadeIn', exitTransition: 'fadeOut', entranceStagger: 0 },
        poster: { entranceTransition: 'featuredCarouselFadeIn', exitTransition: 'fadeOut', entranceStagger: 0 },
        nextPoster: { entranceTransition: 'featuredCarouselFadeIn', exitTransition: 'fadeOut', entranceStagger: 0 },
        previewPoster: { entranceTransition: 'featuredCarouselFadeIn', exitTransition: 'fadeOut', entranceStagger: 0 },
    },
    _a[TransitionType.Left] = {
        // TODO: Stagger poster entrance?
        previousPoster: { entranceTransition: 'featuredCarouselPreviousEnterRight', exitTransition: undefined, entranceStagger: 1 },
        poster: { entranceTransition: undefined, exitTransition: 'featuredCarouselPosterExitRight', entranceStagger: 0 },
        nextPoster: { entranceTransition: 'featuredCarouselNextEnterRight', exitTransition: undefined, entranceStagger: 0 },
        previewPoster: { entranceTransition: undefined, exitTransition: 'featuredCarouselPreviewExitRight', entranceStagger: 0 },
    },
    _a[TransitionType.Right] = {
        previousPoster: { entranceTransition: 'featuredCarouselPreviousEnterLeft', exitTransition: 'featuredCarouselPreviousExitLeft', entranceStagger: 0 },
        poster: { entranceTransition: 'slideInLeft', exitTransition: 'featuredCarouselPosterExitLeft', entranceStagger: 1 },
        nextPoster: { entranceTransition: 'featuredCarouselNextEnterLeft', exitTransition: 'slideOutLeft', entranceStagger: 0 },
        previewPoster: { entranceTransition: 'featuredCarouselPreviewEnterLeft', exitTransition: 'featuredCarouselPreviewExitLeft', entranceStagger: 0 },
    },
    _a);
var bem = bemBlock('web-featured-carousel');
function getTransitionType(currentIndex, nextIndex, itemsCount) {
    // Can rotate up to two tiles to the right
    if ([1, 2].includes((nextIndex > currentIndex ? nextIndex : nextIndex + itemsCount)
        - currentIndex)) {
        return TransitionType.Right;
    }
    if (currentIndex - nextIndex === 1 || (currentIndex === 0 && nextIndex === itemsCount - 1)) {
        return TransitionType.Left;
    }
    return TransitionType.Reset;
}
function FeaturedCarousel(_a) {
    var _b;
    var indexProp = _a.index, _c = _a.initialIndex, initialIndex = _c === void 0 ? 0 : _c, data = _a.data, extraKey = _a.extraKey, renderItem = _a.renderItem, className = _a.className, style = _a.style, children = _a.children, onIndexChange = _a.onIndexChange, onActiveItemClick = _a.onActiveItemClick, landscapeForLinear = _a.landscapeForLinear;
    var itemsCount = data.length;
    var transitionTypeRef = useRef(TransitionType.Enter);
    var _d = useState(initialIndex), autoindex = _d[0], setAutoIndex = _d[1];
    var controlledOrAutoIndex = indexProp !== null && indexProp !== void 0 ? indexProp : autoindex;
    var _e = useState(controlledOrAutoIndex), index = _e[0], setIndex = _e[1];
    if (controlledOrAutoIndex !== index) {
        // Ref is used to persist transition type until no longer valid
        transitionTypeRef.current = getTransitionType(index, controlledOrAutoIndex, itemsCount);
    }
    var transitionType = transitionTypeRef.current;
    // Index needs to be updated asynchronously so exit transition will display
    // properly. Specifically, we need to render once with the prior transition
    // type so TransitionGroup can apply the correct exit transition.
    useEffect(function () {
        // Force asynchrony with setTimeout() to avoid conflict with synchronous
        // TransitionGroup re-renders
        var timer = setTimeout(function () {
            if (controlledOrAutoIndex !== index) {
                setIndex(controlledOrAutoIndex);
            }
        }, 0);
        return function () {
            clearTimeout(timer);
        };
    }, [controlledOrAutoIndex, index]);
    var getItem = function (index) {
        var _a, _b;
        var item = data[index];
        return {
            index: index,
            item: item,
            key: (_b = (_a = item.id) !== null && _a !== void 0 ? _a : extraKey === null || extraKey === void 0 ? void 0 : extraKey(item, index)) !== null && _b !== void 0 ? _b : index,
        };
    };
    var getTileOrientation = function (video) {
        return landscapeForLinear && video.type === 'l' ? 'landscape' : 'poster';
    };
    var clampIndex = useCallback(function (index) {
        var remainder = index % itemsCount;
        return remainder < 0 ? remainder + itemsCount : remainder;
    }, [itemsCount]);
    var handleNextClick = useCallback(function (e) {
        e.stopPropagation();
        var nextIndex = clampIndex(index + 1);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [onIndexChange, index, clampIndex]);
    var handlePreviewClick = useCallback(function (e) {
        e.stopPropagation();
        var nextIndex = clampIndex(index + 2);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [onIndexChange, index, clampIndex]);
    var handlePreviousClick = useCallback(function (e) {
        e.stopPropagation();
        var nextIndex = clampIndex(index - 1);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [onIndexChange, index, clampIndex]);
    var handleActiveClick = useCallback(function (e) {
        e.stopPropagation();
        onActiveItemClick === null || onActiveItemClick === void 0 ? void 0 : onActiveItemClick();
    }, [onActiveItemClick]);
    var getItemNodeRef = useRefMap(null)[0];
    if (itemsCount === 0) {
        return null; // Placeholder UI is not implemented
    }
    var previousItem = getItem(clampIndex(index - 1));
    var currentItem = getItem(clampIndex(index));
    var nextItem = getItem(clampIndex(index + 1));
    var previewItem = getItem(clampIndex(index + 2));
    var transitions = FEATURED_CAROUSEL_TRANSITIONS[transitionType];
    var shouldStaggerPosterTransition = transitionType === TransitionType.Left;
    return (React.createElement("div", { className: classNames(bem.block, className), style: style },
        React.createElement(TransitionGroup, { className: bem.element("left-".concat(getTileOrientation(currentItem.item), "s")) },
            itemsCount > 3
                ? React.createElement(EnterExitTransition, __assign({ key: previousItem.key, "data-test-id": "featured-carousel-transition-".concat(previousItem.key), nodeRef: getItemNodeRef("".concat(previousItem.key, "--previous")) }, transitions.previousPoster),
                    React.createElement("div", { ref: getItemNodeRef("".concat(previousItem.key, "--previous")), className: classNames(bem.element(getTileOrientation(previousItem.item)), bem.elementModifier(getTileOrientation(previousItem.item), 'is-nonactive'), bem.elementModifier(getTileOrientation(previousItem.item), 'previous')) },
                        renderItem(previousItem.item, previousItem.index),
                        React.createElement("div", { className: bem.element('poster-interaction-overlay'), onClick: handlePreviousClick })))
                : null,
            React.createElement(EnterExitTransition, __assign({ key: currentItem.key, "data-test-id": currentItem.key, nodeRef: getItemNodeRef("".concat(currentItem.key, "--current")) }, transitions.poster),
                React.createElement("div", { ref: getItemNodeRef("".concat(currentItem.key, "--current")), onClick: handleActiveClick, className: classNames(bem.element(getTileOrientation(currentItem.item)), (_b = {},
                        _b[bem.elementModifier(getTileOrientation(currentItem.item), 'add-manual-stagger')] = shouldStaggerPosterTransition,
                        _b)) }, renderItem(currentItem.item, currentItem.index, true)))),
        React.createElement("div", { className: bem.element('content') }, children),
        React.createElement(TransitionGroup, { className: bem.element("right-".concat(getTileOrientation(nextItem.item), "s")) },
            itemsCount > 1
                ? React.createElement(EnterExitTransition, __assign({ key: nextItem.key, "data-test-id": nextItem.key, nodeRef: getItemNodeRef("".concat(nextItem.key, "--next")) }, transitions.nextPoster),
                    React.createElement("div", { ref: getItemNodeRef("".concat(nextItem.key, "--next")), className: classNames(bem.element(getTileOrientation(nextItem.item)), bem.elementModifier(getTileOrientation(nextItem.item), 'is-next'), bem.elementModifier(getTileOrientation(nextItem.item), 'is-nonactive')) },
                        renderItem(nextItem.item, nextItem.index),
                        React.createElement("div", { className: bem.element('poster-interaction-overlay'), onClick: handleNextClick })))
                : null,
            itemsCount > 2
                ? React.createElement(EnterExitTransition, __assign({ key: previewItem.key, "data-test-id": previewItem.key, nodeRef: getItemNodeRef("".concat(previewItem.key, "--preview")) }, transitions.previewPoster),
                    React.createElement("div", { ref: getItemNodeRef("".concat(previewItem.key, "--preview")), className: classNames(bem.element(getTileOrientation(previewItem.item)), bem.elementModifier(getTileOrientation(previewItem.item), 'is-nonactive'), bem.elementModifier(getTileOrientation(previewItem.item), 'preview')) },
                        renderItem(previewItem.item, previewItem.index),
                        React.createElement("div", { className: bem.element('poster-interaction-overlay'), onClick: handlePreviewClick })))
                : null)));
}
// The memo() function does not properly preserve generics
export default memo(FeaturedCarousel);
//# sourceMappingURL=FeaturedCarousel.js.map