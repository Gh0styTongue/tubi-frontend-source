import { __assign } from "tslib";
import { useIsomorphicLayoutEffect } from '@adrise/utils/lib/useIsomorphicLayoutEffect';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import React, { useEffect, useRef, useState, memo, useCallback, useReducer, useMemo } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import CarouselShell from './CarouselShell';
import { bemBlock } from '../../utils/bem';
import Grid from '../Grid/Grid';
var CAROUSEL_COLS = {
    largeLandscape: {
        xs: '12',
        sMd: '8',
        xl: '6',
        xxl: '4',
    },
    landscape: {
        xs: '12',
        sMd: '6',
        xl: '4',
        xxl: '3',
    },
    previewableLandscape: {
        xs: '5',
        sMd: '4',
        md: '3',
        xxl: '1-5',
    },
    portrait: {
        xs: '4',
        lg: '3',
        xl: '1-5',
        xxl: '2',
    },
};
var bem = bemBlock('web-carousel');
function layoutReducer(state, action) {
    switch (action.type) {
        case 'didMeasureLayout':
            return {
                colWidth: action.colWidth,
                colsPerPage: action.colsPerPage,
                // Don't enable transition during mount or layout update
                isTransitionEnabled: false,
            };
        case 'didApplyLayout':
            return __assign(__assign({}, state), { isTransitionEnabled: true });
        // istanbul ignore next: defensive fallback for unhandled action types
        default:
            return state;
    }
}
var layoutInitialState = {
    colWidth: 0,
    colsPerPage: 0,
    isTransitionEnabled: true,
};
function Carousel(_a) {
    var _b;
    var _c = _a.initialIndex, initialIndex = _c === void 0 ? 0 : _c, onIndexChange = _a.onIndexChange, advance = _a.advance, className = _a.className, style = _a.style, data = _a.data, _d = _a.tileOrientation, tileOrientation = _d === void 0 ? 'portrait' : _d, renderItem = _a.renderItem, extraKey = _a.extraKey, adjustPrevNextForContentTile = _a.adjustPrevNextForContentTile, indexProp = _a.index, showItemOverflow = _a.showItemOverflow, breakpoints = _a.breakpoints, shouldAlwaysShowIcons = _a.shouldAlwaysShowIcons, isPlaceholder = _a.isPlaceholder, containerClassName = _a.containerClassName, prevNextClassName = _a.prevNextClassName;
    var containerRef = useRef(null);
    var _e = useState(initialIndex), preferredIndex = _e[0], setPreferredIndex = _e[1];
    var _f = useReducer(layoutReducer, layoutInitialState), layoutState = _f[0], dispatch = _f[1];
    var colWidth = layoutState.colWidth, colsPerPage = layoutState.colsPerPage, isTransitionEnabled = layoutState.isTransitionEnabled;
    var enableTransitionTimeoutRef = useRef();
    var numColsRef = useRef(data.length);
    var index = indexProp !== null && indexProp !== void 0 ? indexProp : preferredIndex;
    // if the data length is less than the number of columns per page, reset the index to 0
    if (data.length <= colsPerPage) {
        index = 0;
    }
    // Layout effect stores col count before resize handler can fire
    useIsomorphicLayoutEffect(function () {
        numColsRef.current = data.length;
    }, [data.length]);
    var resizeHandler = useCallback(function () {
        var containerEl = containerRef.current;
        if (containerEl) {
            var colCount_1 = numColsRef.current;
            var newColWidth = containerEl.scrollWidth / colCount_1;
            dispatch({
                type: 'didMeasureLayout',
                colWidth: newColWidth,
                colsPerPage: Math.round(containerEl.getBoundingClientRect().width / newColWidth),
            });
            enableTransitionTimeoutRef.current = window.setTimeout(function () {
                dispatch({ type: 'didApplyLayout' });
            }, 0);
        }
    }, []);
    // Memoized dependency above (resizeHandler) itself has no dependencies
    var debouncedResizeHandler = useMemo(function () { return debounce(resizeHandler, 250); }, [resizeHandler]);
    useEffect(function () {
        if (containerRef.current) {
            resizeHandler();
            var resizeObserver_1 = new ResizeObserver(debouncedResizeHandler);
            var containerNode_1 = containerRef.current;
            resizeObserver_1.observe(containerNode_1);
            return function () {
                if (enableTransitionTimeoutRef.current !== undefined) {
                    window.clearTimeout(enableTransitionTimeoutRef.current);
                }
                resizeObserver_1.unobserve(containerNode_1);
            };
        }
    }, [debouncedResizeHandler, resizeHandler]);
    var next = function () {
        var newIndex = advance
            ? Math.max(0, Math.min(index + colsPerPage, data.length - colsPerPage))
            : index + colsPerPage;
        if (newIndex < colCount) {
            var newPageIndex = Math.floor((newIndex + colsPerPage - 1) / colsPerPage);
            setPreferredIndex(newIndex);
            if (onIndexChange) {
                onIndexChange({
                    colsPerPage: colsPerPage,
                    pageIndex: newPageIndex,
                    itemIndex: newIndex,
                });
            }
        }
    };
    var previous = function () {
        var newIndex = Math.max(index - colsPerPage, 0);
        var newPageIndex = Math.floor((newIndex + colsPerPage - 1) / colsPerPage);
        setPreferredIndex(newIndex);
        if (onIndexChange) {
            onIndexChange({
                colsPerPage: colsPerPage,
                pageIndex: newPageIndex,
                itemIndex: newIndex,
            });
        }
    };
    var rowStyle = {
        transform: "translate3d(".concat(-index * colWidth, "px, 0, 0)"),
    };
    var colCount = data.length;
    var hasPrevious = !isPlaceholder && index > 0;
    var hasNext = !isPlaceholder && index + colsPerPage < colCount;
    var renderCarouselItem = useCallback(function (item, itemIndex) {
        var _a;
        var getKey = function (item) {
            if (typeof item === 'string') {
                return item;
            }
            var itemId = item === null || item === void 0 ? void 0 : item.id;
            if (itemId) {
                return String(itemId);
            }
            return undefined;
        };
        var isSideElement = (colsPerPage > 0 && itemIndex === index + colsPerPage) || itemIndex === index - 1;
        var className = classNames(bem.element('item'), (_a = {},
            _a[bem.elementModifier('item', 'enable-transition')] = isTransitionEnabled,
            _a[bem.elementModifier('item', 'masked')] = isSideElement,
            _a));
        var key = (extraKey === null || extraKey === void 0 ? void 0 : extraKey(item, itemIndex)) || getKey(item) || itemIndex;
        var layoutInfo = {
            indexInViewport: itemIndex % colsPerPage,
            itemsPerPage: colsPerPage,
        };
        return (React.createElement(Grid.Item, __assign({ key: key }, (breakpoints || CAROUSEL_COLS[tileOrientation]), { className: className }), renderItem(item, itemIndex, layoutInfo)));
    }, [breakpoints, colsPerPage, extraKey, index, renderItem, isTransitionEnabled, tileOrientation]);
    return (React.createElement(CarouselShell, { adjustPrevNextForContentTile: adjustPrevNextForContentTile, className: className, style: style, hasNext: hasNext, hasPrevious: hasPrevious, onNext: next, onPrevious: previous, showItemOverflow: showItemOverflow, iconVisibe: shouldAlwaysShowIcons, prevNextClassName: prevNextClassName },
        React.createElement("div", { className: "web-carousel__container" },
            React.createElement(Grid.Container, { ref: containerRef, className: classNames(bem.block, containerClassName, (_b = {},
                    _b[bem.modifier('enable-transition')] = isTransitionEnabled,
                    _b)), style: rowStyle, includeMargin: !!showItemOverflow }, data.map(renderCarouselItem)))));
}
// The memo() function does not properly preserve generics
export default memo(Carousel);
//# sourceMappingURL=Carousel.js.map