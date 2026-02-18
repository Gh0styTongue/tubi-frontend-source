import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { useMemo } from 'react';
import CountIndicator from './CountIndicator';
import { PORTRAIT_VISIBLE_TILES } from '../../constants/ui';
import omitInvalidProps from '../../omitInvalidProps';
import GridHeader from '../GridHeader/GridHeader';
import Placeholder from '../Placeholder/Placeholder';
import { TilePlaceholder } from '../Tile/Tile';
import TileRow from '../TileRow/TileRow';
import './ContentRow.scss';
var ContentRow = function (_a) {
    var _b = _a.animated, animated = _b === void 0 ? true : _b, _c = _a.enabledHeaderTransition, enabledHeaderTransition = _c === void 0 ? true : _c, fade = _a.fade, large = _a.large, larger = _a.larger, isNew = _a.isNew, labelText = _a.labelText, showHeader = _a.showHeader, showIndicator = _a.showIndicator, title = _a.title, activeNumber = _a.activeNumber, totalNumber = _a.totalNumber, style = _a.style, className = _a.className, headerClassName = _a.headerClassName, children = _a.children, header = _a.header, isPromoRow = _a.isPromoRow, isVideoTileRow = _a.isVideoTileRow, attributes = __rest(_a, ["animated", "enabledHeaderTransition", "fade", "large", "larger", "isNew", "labelText", "showHeader", "showIndicator", "title", "activeNumber", "totalNumber", "style", "className", "headerClassName", "children", "header", "isPromoRow", "isVideoTileRow"]);
    var outerCls = classNames(className, 'ott-content-row-wrapper', {
        'ott-content-row-wrapper__fade': fade === true,
        'ott-content-row-wrapper__fade-25': fade === 25,
        'ott-content-row-wrapper__fade-light': fade === 'light',
        'ott-content-row-wrapper__transitions': animated,
        'ott-content-row-wrapper__with-throttler': animated,
        'ott-content-row-wrapper__large': large,
        'ott-content-row-wrapper__larger': larger,
        'ott-content-row-wrapper__promoRow': isPromoRow,
        'ott-content-row-wrapper--video-tile-row': isVideoTileRow,
    });
    var gridHeaderCls = classNames(headerClassName, 'ott-content-row-wrapper__grid-header', {
        'ott-content-row-wrapper__grid-header__hide': !showHeader,
        'ott-content-row-wrapper__grid-header__transitions': animated && enabledHeaderTransition,
        'ott-content-row-wrapper__grid-header__live': isNew,
        'ott-content-row-wrapper__grid-header__with-throttler': animated && enabledHeaderTransition,
    });
    return (React.createElement("div", __assign({ className: outerCls, style: style, "data-test-id": "contentRow" }, omitInvalidProps(attributes)),
        header || React.createElement(GridHeader, { cls: gridHeaderCls, title: title, labelText: isNew ? labelText : '' }),
        showIndicator && !!totalNumber
            ? React.createElement(CountIndicator, { activeNumber: activeNumber, totalNumber: totalNumber })
            : null,
        children));
};
ContentRow.displayName = 'ContentRow';
var ContentRowPlaceholder = function (_a) {
    var style = _a.style, _b = _a.size, size = _b === void 0 ? 'normal' : _b, _c = _a.type, type = _c === void 0 ? 'landscape' : _c, key = _a.key;
    var placeholders = useMemo(function () {
        return Array.from({ length: PORTRAIT_VISIBLE_TILES + 1 }, // + 1 for the translucent tile in the end
        function (element, index) { return index; }).map(function (key) { return (React.createElement(TilePlaceholder, { key: key, size: size, type: type })); });
    }, [size, type]);
    return (React.createElement("div", { key: key, className: "ott-content-row-wrapper", style: style, "data-test-id": "ott-content-row-wrapper" },
        React.createElement(Placeholder, { className: "ott-content-row-wrapper__grid-header", width: 140, isTextStyle: true }),
        React.createElement(TileRow, null, placeholders)));
};
ContentRowPlaceholder.displayName = 'ContentRowPlaceholder';
export { ContentRowPlaceholder };
export default ContentRow;
//# sourceMappingURL=ContentRow.js.map