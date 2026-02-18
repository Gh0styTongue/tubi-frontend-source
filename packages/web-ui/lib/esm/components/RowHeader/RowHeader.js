import { toCSSUrl } from '@adrise/utils/lib/url';
import { ChevronRight } from '@tubitv/icons';
import classNames from 'classnames';
import React, { memo } from 'react';
import { Link } from 'react-router';
function RowHeader(_a) {
    var href = _a.href, logo = _a.logo, style = _a.style, className = _a.className, children = _a.children, onLinkClick = _a.onLinkClick;
    var classes = classNames('web-row-header', className, {
        'web-row-header--link': !!href,
    });
    var contents = React.createElement(React.Fragment, null,
        logo
            ? React.createElement("div", { className: "web-row-header__logo", style: { backgroundImage: toCSSUrl(logo) } })
            : null,
        React.createElement("div", { className: "web-row-header__title" }, children),
        href
            ? React.createElement(ChevronRight, { className: "web-row-header__chevron" })
            : null);
    return href
        ? React.createElement(Link, { to: href, onClick: onLinkClick, className: classes, style: style }, contents)
        : React.createElement("div", { className: classes, style: style }, contents);
}
export default memo(RowHeader);
//# sourceMappingURL=RowHeader.js.map