import { mins } from '@adrise/utils/lib/time';
import { Info } from '@tubitv/icons';
import classNames from 'classnames';
import React, { memo, useCallback, useMemo } from 'react';
export var PROGRAM_WIDTH_PX_PER_MS = 164 / mins(30);
var PROGRAM_MIN_WIDTH = 32;
var PROGRAM_MARGIN_RIGHT_PX = 4;
var getProgramStyle = function (duration) {
    return !duration ? {
        width: '100%',
    } : {
        width: Math.max(duration * PROGRAM_WIDTH_PX_PER_MS - PROGRAM_MARGIN_RIGHT_PX, PROGRAM_MIN_WIDTH),
        marginRight: PROGRAM_MARGIN_RIGHT_PX,
    };
};
var ProgramBar = function (_a) {
    var containerId = _a.containerId, programKey = _a.programKey, title = _a.title, description = _a.description, duration = _a.duration, isInProgress = _a.isInProgress, isActive = _a.isActive, onProgramClick = _a.onProgramClick, onInfoClick = _a.onInfoClick;
    var programClickHandler = useCallback(function (event) {
        event.preventDefault();
        event.stopPropagation();
        onProgramClick === null || onProgramClick === void 0 ? void 0 : onProgramClick(programKey, isInProgress, containerId);
    }, [onProgramClick, programKey, isInProgress, containerId]);
    var infoIconClickHandler = useCallback(function (event) {
        event.preventDefault();
        event.stopPropagation();
        onInfoClick === null || onInfoClick === void 0 ? void 0 : onInfoClick(programKey);
    }, [programKey, onInfoClick]);
    var style = useMemo(function () { return getProgramStyle(duration); }, [duration]);
    var programClass = classNames('web-epg-program', {
        'web-epg-program--active': isActive,
    });
    return (React.createElement("div", { className: programClass, style: style, onClick: programClickHandler },
        React.createElement("div", { className: "web-epg-program__title" },
            React.createElement("div", { className: "web-epg-program__title__text" }, title)),
        !duration || duration > mins(20) ? (React.createElement("div", { className: "web-epg-program__description" }, description)) : null,
        React.createElement("div", { className: "web-epg-program__info-icon", onClick: infoIconClickHandler },
            React.createElement(Info, null))));
};
export default memo(ProgramBar);
//# sourceMappingURL=ProgramBar.js.map