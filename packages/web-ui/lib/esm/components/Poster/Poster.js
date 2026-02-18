import { __assign } from "tslib";
import classNames from 'classnames';
import React, { memo } from 'react';
import { Helmet } from 'react-helmet-async';
function Poster(_a) {
    var _b;
    var className = _a.className, style = _a.style, src = _a.src, srcSet = _a.srcSet, sizes = _a.sizes, zoom = _a.zoom, tileOrientation = _a.tileOrientation, progress = _a.progress, hideProgress = _a.hideProgress, _c = _a.alt, alt = _c === void 0 ? '' : _c, fetchPriority = _a.fetchPriority, _d = _a.lazyActive, lazyActive = _d === void 0 ? true : _d, lazyLoad = _a.lazyLoad, _e = _a.preload, preload = _e === void 0 ? false : _e, _f = _a.enablePreview, enablePreview = _f === void 0 ? false : _f, previewAnchor = _a.previewAnchor;
    var preloadImageProps = {
        rel: 'preload',
        fetchpriority: 'high',
        as: 'image',
        href: src,
    };
    var imgProps = {
        className: 'web-poster__image-element',
        src: src,
        srcSet: srcSet,
        sizes: sizes,
        alt: alt,
        fetchpriority: fetchPriority,
        loading: lazyLoad ? 'lazy' : undefined,
    };
    var shouldPreload = preload && !!src;
    var shouldRenderImg = lazyActive && Boolean(src || srcSet);
    return (React.createElement("div", { className: classNames('web-poster', className, {
            'web-poster__previewable': enablePreview,
        }), style: style },
        shouldPreload ? (React.createElement(Helmet, null,
            React.createElement("link", __assign({}, preloadImageProps)))) : null,
        React.createElement("div", { className: classNames('web-poster__image-container', (_b = {
                    'web-poster__image-container--zoom': zoom
                },
                _b["web-poster__image-container--zoom-".concat(previewAnchor)] = previewAnchor,
                _b['web-poster__image-container--landscape'] = tileOrientation === 'landscape',
                _b)) }, shouldRenderImg ?
            // eslint-disable-next-line jsx-a11y/no-redundant-roles
            React.createElement("img", __assign({}, imgProps, { role: "img" })) : null),
        progress !== undefined ? (React.createElement("div", { className: classNames('web-poster__progress', {
                'web-poster__progress--hide': hideProgress,
            }) },
            React.createElement("div", { className: "web-poster__progress-elapsed", style: { width: "".concat(100 * progress, "%") } }))) : null));
}
export default memo(Poster);
//# sourceMappingURL=Poster.js.map