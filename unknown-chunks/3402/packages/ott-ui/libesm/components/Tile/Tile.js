import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { useMemo } from 'react';
import omitInvalidProps from '../../omitInvalidProps';
import Expiration from '../Expiration/Expiration';
import { Count } from '../Icons/Count';
import Placeholder, { PlaceholderType } from '../Placeholder/Placeholder';
import Progress from '../Progress/Progress';
import './Tile.scss';
var Tile = function (_a) {
    var className = _a.className, selectorClassName = _a.selectorClassName, fade = _a.fade, fadeLight = _a.fadeLight, fadeOut = _a.fadeOut, isLiveDesign = _a.isLiveDesign, contentWithinTile = _a.contentWithinTile, percentComplete = _a.percentComplete, _b = _a.showSelector, showSelector = _b === void 0 ? false : _b, _c = _a.type, type = _c === void 0 ? 'portrait' : _c, size = _a.size, text = _a.text, subText = _a.subText, id = _a.id, style = _a.style, expiry = _a.expiry, renderedImage = _a.renderedImage, children = _a.children, _d = _a.animated, animated = _d === void 0 ? false : _d, _e = _a.fadeTransitionDuration, fadeTransitionDuration = _e === void 0 ? 'default' : _e, rank = _a.rank, attributes = __rest(_a, ["className", "selectorClassName", "fade", "fadeLight", "fadeOut", "isLiveDesign", "contentWithinTile", "percentComplete", "showSelector", "type", "size", "text", "subText", "id", "style", "expiry", "renderedImage", "children", "animated", "fadeTransitionDuration", "rank"]);
    var rankImage = useMemo(function () {
        if (typeof rank === 'number') {
            return React.createElement(Count, { idx: rank });
        }
    }, [rank]);
    var isPromoRow = size === 'promo-large' || size === 'promo-normal';
    var wrapperCls = classNames('ott-tile-wrapper', className, type, size !== 'normal' && size, {
        'live': isLiveDesign,
        'within-tile': contentWithinTile,
        fade: fade,
        'fade-light': fadeLight,
        'fade-out': fadeOut,
        'ott-tile-wrapper--animated': animated,
        'ott-tile-wrapper--animated-fade-transition-fast': animated && fadeTransitionDuration === 'fast',
        'with-rank': rankImage,
        'promo-tile': isPromoRow,
    });
    var selectorClassNames = classNames('selector', selectorClassName);
    var progress = function (percentComplete) {
        var adjustedPercentComplete = Math.max(0.02, percentComplete);
        return (React.createElement("div", { className: "progress-wrapper" },
            React.createElement(Progress, { percentComplete: adjustedPercentComplete, className: "progress-bar" })));
    };
    var isFullOpacity = !(fade || fadeLight || fadeOut);
    return isPromoRow ? (React.createElement("div", __assign({ "data-test-id": "ottPromoTile", className: wrapperCls, style: style }, omitInvalidProps(attributes)),
        React.createElement("div", { className: classNames('image-container') },
            renderedImage,
            showSelector ? React.createElement("div", { className: selectorClassNames, "data-test-id": "selector-".concat(id) }) : null))) : (React.createElement("div", __assign({ "data-test-id": "ottTile", className: wrapperCls, style: style }, omitInvalidProps(attributes)),
        isFullOpacity ? React.createElement(Expiration, { days: expiry, className: "expiration" }, "".concat(expiry, "d")) : null,
        rankImage ? React.createElement("div", { className: "rank", "data-test-id": "ottTileRank" }, rankImage) : null,
        renderedImage,
        children,
        text ? React.createElement("div", { className: "text", "data-test-id": "ottTileTitle" }, text) : null,
        subText ? React.createElement("div", { className: "sub-text" }, subText) : null,
        typeof percentComplete === 'number' ? progress(percentComplete) : null,
        showSelector ? React.createElement("div", { className: selectorClassNames, "data-test-id": "selector-".concat(id) }) : null));
};
var TilePlaceholder = function (_a) {
    var _b = _a.type, type = _b === void 0 ? 'portrait' : _b, _c = _a.size, size = _c === void 0 ? 'normal' : _c;
    var showText = type === 'landscape' && size === 'normal';
    var wrapperCls = classNames('ott-tile-wrapper', type, size !== 'normal' && size);
    return (React.createElement("div", { className: wrapperCls },
        React.createElement(Placeholder, { className: "image" }),
        showText ? (React.createElement("div", { className: "text" },
            React.createElement(Placeholder, { type: PlaceholderType.Text, charCount: 20 }))) : null));
};
Tile.displayName = 'Tile';
TilePlaceholder.displayName = 'TilePlaceholder';
export { TilePlaceholder };
export default Tile;
//# sourceMappingURL=Tile.js.map