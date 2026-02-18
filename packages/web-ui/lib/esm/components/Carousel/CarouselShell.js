import { __assign } from "tslib";
import { ChevronCircleLeft, ChevronCircleRight } from '@tubitv/icons';
import classNames from 'classnames';
import React, { memo } from 'react';
import useCarouselSwipe from '../../hooks/useCarouselSwipe';
import { bemBlock } from '../../utils/bem';
var bem = bemBlock('web-carousel-shell');
function CarouselShell(_a) {
    var _b, _c, _d, _e;
    var adjustPrevNextForContentTile = _a.adjustPrevNextForContentTile, className = _a.className, style = _a.style, hasNext = _a.hasNext, hasPrevious = _a.hasPrevious, children = _a.children, onNext = _a.onNext, onPrevious = _a.onPrevious, showItemOverflow = _a.showItemOverflow, absolutePosition = _a.absolutePosition, iconVisibe = _a.iconVisibe, prevNextClassName = _a.prevNextClassName;
    var classes = classNames(bem.block, className, (_b = {}, _b[bem.modifier('absolute-position')] = absolutePosition, _b));
    var touchHandlers = useCarouselSwipe({ onNext: onNext, onPrevious: onPrevious });
    var previousNextIconClassName = classNames(bem.element('previous-next-icon'), (_c = {},
        _c[bem.elementModifier('previous-next-icon', 'for-content-tile')] = adjustPrevNextForContentTile,
        _c[bem.elementModifier('previous-next-icon', 'for-no-overflowing-item')] = !showItemOverflow,
        _c));
    var nextClassName = classNames(bem.element('next'), prevNextClassName, (_d = {},
        _d[bem.elementModifier('next', 'for-no-overflowing-item')] = !showItemOverflow,
        _d[bem.elementModifier('next', 'icon-visible')] = iconVisibe,
        _d));
    var previousClassName = classNames(bem.element('previous'), prevNextClassName, (_e = {},
        _e[bem.elementModifier('previous', 'for-no-overflowing-item')] = !showItemOverflow,
        _e[bem.elementModifier('previous', 'icon-visible')] = iconVisibe,
        _e));
    return (React.createElement("div", __assign({ className: classes, style: style }, touchHandlers),
        hasPrevious ? (React.createElement("div", { className: previousClassName, onClick: onPrevious },
            React.createElement(ChevronCircleLeft, { className: previousNextIconClassName }))) : null,
        children,
        hasNext ? (React.createElement("div", { className: nextClassName, onClick: onNext },
            React.createElement(ChevronCircleRight, { className: previousNextIconClassName }))) : null));
}
export default memo(CarouselShell);
//# sourceMappingURL=CarouselShell.js.map