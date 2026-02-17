import { Play } from '@tubitv/icons';
import classNames from 'classnames';
import React, { memo, useCallback } from 'react';
function PlayButton(_a) {
    var style = _a.style, className = _a.className, label = _a.label, onClick = _a.onClick;
    var clickHandler = useCallback(function (event) {
        event.stopPropagation();
        onClick === null || onClick === void 0 ? void 0 : onClick();
    }, [onClick]);
    return (React.createElement("div", { onClick: clickHandler, className: classNames('web-play-button', className), style: style },
        React.createElement("div", { className: "web-play-button__play-icon-container" },
            React.createElement("svg", { className: "web-play-button__circle", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", xmlns: "http://www.w3.org/2000/svg" },
                React.createElement("rect", { x: "1", y: "1", width: "46", height: "46", rx: "23", strokeWidth: "2" })),
            React.createElement(Play, { className: "web-play-button__play-icon" })),
        label ? React.createElement("div", { className: "web-play-button__label" }, label) : null));
}
export default memo(PlayButton);
//# sourceMappingURL=PlayButton.js.map