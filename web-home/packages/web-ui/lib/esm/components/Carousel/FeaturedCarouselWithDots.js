import classNames from 'classnames';
import React, { memo, useState, useEffect, useCallback } from 'react';
import { bemBlock } from '../../utils/bem';
var bem = bemBlock('web-featured-carousel-with-dots');
export function useNewFeatureCarousel(_a) {
    var initialIndex = _a.initialIndex, itemsCount = _a.itemsCount, extraKey = _a.extraKey;
    var _b = useState(0), index = _b[0], setIndex = _b[1];
    var _c = useState(false), activeStarted = _c[0], setActiveStarted = _c[1];
    var _d = useState(initialIndex), autoindex = _d[0], setAutoIndex = _d[1];
    // If the extraKey changes, reset the activeStarted state
    // i.e. the contentMode change from movie to tv-show
    useEffect(function () {
        setActiveStarted(false);
    }, [extraKey]);
    var clampIndex = useCallback(function (index) {
        var remainder = index % itemsCount;
        return remainder < 0 ? remainder + itemsCount : remainder;
    }, [itemsCount]);
    return { index: index, setIndex: setIndex, activeStarted: activeStarted, setActiveStarted: setActiveStarted, autoindex: autoindex, setAutoIndex: setAutoIndex, clampIndex: clampIndex };
}
function FeaturedCarouselWithDots(_a) {
    var indexProp = _a.index, _b = _a.initialIndex, initialIndex = _b === void 0 ? 0 : _b, data = _a.data, renderItem = _a.renderItem, className = _a.className, style = _a.style, children = _a.children, onIndexChange = _a.onIndexChange, extraKey = _a.extraKey;
    var itemsCount = data.length;
    var _c = useNewFeatureCarousel({
        initialIndex: initialIndex,
        itemsCount: itemsCount,
        extraKey: extraKey,
    }), index = _c.index, setIndex = _c.setIndex, activeStarted = _c.activeStarted, setActiveStarted = _c.setActiveStarted, autoindex = _c.autoindex, setAutoIndex = _c.setAutoIndex, clampIndex = _c.clampIndex;
    var controlledOrAutoIndex = indexProp !== null && indexProp !== void 0 ? indexProp : autoindex;
    // Index needs to be updated asynchronously so transition will display
    useEffect(function () {
        // Force asynchrony with setTimeout() to avoid conflict with synchronous rerenders
        var timer = setTimeout(function () {
            if (controlledOrAutoIndex !== index) {
                setIndex(controlledOrAutoIndex);
            }
            setActiveStarted(true);
        }, 0);
        return function () {
            clearTimeout(timer);
        };
    }, [extraKey, controlledOrAutoIndex, index, setActiveStarted, setIndex]);
    var handleDotClick = useCallback(function (e, clickedIndex) {
        e.stopPropagation();
        var nextIndex = clampIndex(clickedIndex);
        onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange({ itemIndex: nextIndex });
        setAutoIndex(nextIndex);
    }, [clampIndex, onIndexChange, setAutoIndex]);
    if (itemsCount === 0) {
        return null;
    }
    return (React.createElement("div", { "data-test-id": "web-featured-carousel-with-dots", className: classNames(bem.block, className), style: style },
        React.createElement("div", { className: bem.element('content') }, children),
        React.createElement("div", { className: bem.element('dots') }, data.map(function (item, itemIndex) {
            var _a;
            return (React.createElement("div", { key: extraKey ? extraKey(item, itemIndex) : itemIndex, onClick: function (e) { return handleDotClick(e, itemIndex); }, className: classNames(bem.element('dot'), (_a = {},
                    _a[bem.elementModifier('dot', 'active')] = itemIndex === index,
                    _a[bem.elementModifier('dot', 'active-start')] = itemIndex === index && activeStarted,
                    _a)) },
                React.createElement("div", { className: bem.element('poster') }, renderItem(item, itemIndex)),
                React.createElement("div", { className: bem.element('progress') })));
        }))));
}
// The memo() function does not properly preserve generics
export default memo(FeaturedCarouselWithDots);
//# sourceMappingURL=FeaturedCarouselWithDots.js.map