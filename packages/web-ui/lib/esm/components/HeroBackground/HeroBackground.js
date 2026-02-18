import { __assign } from "tslib";
import { toCSSUrl } from '@adrise/utils/lib/url';
import classNames from 'classnames';
import React from 'react';
function HeroBackground(_a) {
    var src = _a.src, className = _a.className, style = _a.style, isFullScreen = _a.isFullScreen, customClass = _a.customClass;
    var backgroundImage = src ? "".concat(toCSSUrl(src)) : '';
    var styleWithBackgroundImage = __assign({ backgroundImage: backgroundImage }, style);
    return (React.createElement("div", { className: classNames('web-hero-background', className, customClass, {
            'web-hero-background--full-screen': isFullScreen,
        }), style: styleWithBackgroundImage }));
}
export default HeroBackground;
//# sourceMappingURL=HeroBackground.js.map