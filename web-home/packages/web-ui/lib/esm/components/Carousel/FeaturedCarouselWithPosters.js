import { __assign } from "tslib";
import classNames from 'classnames';
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CarouselShell from './CarouselShell';
import { useNewFeatureCarousel } from './FeaturedCarouselWithDots';
import { bemBlock } from '../../utils/bem';
var bem = bemBlock('web-featured-carousel-with-posters');
var ITEM_COLUMNS = 3; // if columns change, need to update the infinite carousel logic
var COLUMN_WIDTH = 136;
var COLUMN_GAP = 10;
var TRANSITIONS = 'transform ease 0.3s';
function FeaturedCarouselWithPosters(_a) {
    var indexProp = _a.index, _b = _a.initialIndex, initialIndex = _b === void 0 ? 0 : _b, data = _a.data, renderItem = _a.renderItem, className = _a.className, style = _a.style, children = _a.children, onIndexChange = _a.onIndexChange, extraKey = _a.extraKey;
    var itemsCount = data.length;
    var _c = useNewFeatureCarousel({
        initialIndex: initialIndex,
        itemsCount: itemsCount,
        extraKey: extraKey,
    }), index = _c.index, setIndex = _c.setIndex, activeStarted = _c.activeStarted, setActiveStarted = _c.setActiveStarted, autoindex = _c.autoindex, setAutoIndex = _c.setAutoIndex, clampIndex = _c.clampIndex;
    var controlledOrAutoIndex = indexProp !== null && indexProp !== void 0 ? indexProp : autoindex;
    var activeItemStatus = useRef('normal');
    var _d = useState(false), isTransitioning = _d[0], setIsTransitioning = _d[1];
    var itemIsOverflow = index === -1 || index === itemsCount || index === itemsCount + 1;
    var carouselDisabled = itemsCount <= ITEM_COLUMNS;
    // Index needs to be updated asynchronously so transition will display
    useEffect(function () {
        // Force asynchrony with setTimeout() to avoid conflict with synchronous rerenders
        var timer = setTimeout(function () {
            if (controlledOrAutoIndex !== index) {
                // It is a bit complex to make sure the infinite carousel works correctly
                // but now it would be 3 columns, it is a static number
                // update it here if ITEM_COLUMNS change
                if (!carouselDisabled &&
                    (index === itemsCount - 1 || index === itemsCount - 2) &&
                    controlledOrAutoIndex === 0) {
                    // from last or second last to first
                    setIndex(itemsCount);
                }
                else if (!carouselDisabled && index === itemsCount - 1 && controlledOrAutoIndex === 1) {
                    // from last to second
                    setIndex(itemsCount + 1);
                }
                else if (!carouselDisabled && index === 0 && controlledOrAutoIndex === itemsCount - 1) {
                    setIndex(-1);
                }
                else if (!itemIsOverflow) {
                    setIndex(controlledOrAutoIndex);
                }
                if (!carouselDisabled)
                    setIsTransitioning(true);
            }
            setActiveStarted(true);
        }, 0);
        return function () {
            clearTimeout(timer);
        };
    }, [
        controlledOrAutoIndex,
        index,
        itemIsOverflow,
        itemsCount,
        carouselDisabled,
        setActiveStarted,
        activeStarted,
        setIndex,
    ]);
    var handleItemClick = useCallback(function (e, clickedIndex) {
        e.stopPropagation();
        if (isTransitioning)
            return;
        var nextIndex = clampIndex(clickedIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [isTransitioning, clampIndex, onIndexChange, setAutoIndex]);
    var handleNext = useCallback(function () {
        if (isTransitioning)
            return;
        var nextIndex = clampIndex(index + 1);
        /* istanbul ignore next */
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [clampIndex, index, isTransitioning, onIndexChange, setAutoIndex]);
    var handlePrevious = useCallback(function () {
        if (isTransitioning)
            return;
        var nextIndex = clampIndex(index - 1);
        /* istanbul ignore next */
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [clampIndex, index, isTransitioning, onIndexChange, setAutoIndex]);
    var rowStyle = useMemo(function () {
        if (carouselDisabled) {
            return {
                transition: 'none',
                transform: "translate3d(".concat((ITEM_COLUMNS - itemsCount) * (COLUMN_WIDTH + COLUMN_GAP), "px, 0, 0)"),
            };
        }
        return {
            transition: activeItemStatus.current === 'normal' ? TRANSITIONS : 'none',
            transform: "translate3d(".concat(-(index + ITEM_COLUMNS) * (COLUMN_WIDTH + COLUMN_GAP), "px, 0, 0)"),
        };
    }, [carouselDisabled, index, itemsCount]);
    useEffect(function () {
        if (activeItemStatus.current !== 'normal') {
            activeItemStatus.current = 'normal'; // reset to normal for transition
        }
    }, [index]);
    var handleTransitionEnd = useCallback(function () {
        if (itemIsOverflow) {
            activeItemStatus.current = 'item-is-overflow';
            setIndex(controlledOrAutoIndex);
        }
        setIsTransitioning(false);
    }, [controlledOrAutoIndex, itemIsOverflow, setIndex]);
    var currentItems = useMemo(function () {
        var items = data.map(function (v, i) { return (__assign(__assign({}, v), { itemIndex: i })); });
        if (carouselDisabled)
            return items;
        return items
            .slice(items.length - ITEM_COLUMNS)
            .concat(items)
            .concat(items.slice(0, ITEM_COLUMNS + 1));
    }, [data, carouselDisabled]);
    if (itemsCount === 0) {
        return null;
    }
    return (React.createElement("div", { "data-test-id": "web-featured-carousel-with-posters", className: classNames(bem.block, className), style: style },
        React.createElement("div", { className: bem.element('content') }, children),
        React.createElement("div", { className: bem.element('carousel-shell') },
            React.createElement(CarouselShell, { showItemOverflow: true, iconVisibe: true, hasNext: !carouselDisabled, hasPrevious: !carouselDisabled, onNext: handleNext, onPrevious: handlePrevious },
                React.createElement("div", { className: bem.element('carousel-container') },
                    React.createElement("div", { className: bem.element('carousel-container-wrapper'), style: rowStyle, onTransitionEnd: handleTransitionEnd }, currentItems.map(function (item, itemIndex) {
                        var _a;
                        return (React.createElement("div", { key: extraKey ? extraKey(item, itemIndex) : "".concat(item.id, "-").concat(itemIndex), className: classNames(bem.element('landscape'), (_a = {},
                                _a[bem.elementModifier('landscape', 'active')] = index === item.itemIndex && activeStarted,
                                _a)), onClick: function (e) { return handleItemClick(e, item.itemIndex); } },
                            renderItem(item, item.itemIndex),
                            React.createElement("div", { className: classNames(bem.element('progress')) },
                                React.createElement("div", { className: bem.element('progress-elapsed') }))));
                    })))))));
}
// The memo() function does not properly preserve generics
export default memo(FeaturedCarouselWithPosters);
//# sourceMappingURL=FeaturedCarouselWithPosters.js.map