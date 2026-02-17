import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React from 'react';
import { IndexLink, Link } from 'react-router';
/**
 * A simple stateless component that renders an `a` tag by wrapping
 * the react-router `Link` component. The purpose is to apply
 * consistent styling to our `a` tags
 */
var ATag = function (_a) {
    var children = _a.children, to = _a.to, className = _a.className, cls = _a.cls, _b = _a.activeClassName, activeClassName = _b === void 0 ? 'active' : _b, _c = _a.activeAlternate, activeAlternate = _c === void 0 ? false : _c, onClick = _a.onClick, other = __rest(_a, ["children", "to", "className", "cls", "activeClassName", "activeAlternate", "onClick"]);
    var classes = classNames('ATag', className || cls, {
        activeOnWhite: activeAlternate,
    });
    // Internal scrollTo links
    var isScrollToLink = typeof to === 'string' && to.indexOf('#') === 0;
    if (isScrollToLink) {
        return (React.createElement("a", { href: to, onClick: onClick, className: classes }, children));
    }
    // external URL's cannot be passed to <Link>
    // if external URL, we use a simple <a> tag
    var isExternal = typeof to === 'string' &&
        (to.indexOf('//') === 0 ||
            to.indexOf('http') === 0 ||
            to.indexOf('/oz') === 0 ||
            to.indexOf('mailto') === 0);
    if (isExternal) {
        return (React.createElement("a", { href: to, rel: "noopener", target: other.target, className: classes, onClick: onClick }, children));
    }
    var props = __assign({ to: to, className: classes, activeClassName: activeClassName, onClick: onClick, onlyActiveOnIndex: false }, other);
    // using IndexLink for homepage route
    if (to === '/') {
        return React.createElement(IndexLink, __assign({}, props, { "data-test-id": "atag-indexlink" }), children);
    }
    return (React.createElement(Link, __assign({}, props, { "data-test-id": "atag-link" }), children));
};
export default ATag;
//# sourceMappingURL=ATag.js.map