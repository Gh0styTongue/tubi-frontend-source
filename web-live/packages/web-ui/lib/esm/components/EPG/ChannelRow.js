import { __assign } from "tslib";
import { convertToDate } from '@adrise/utils/lib/time';
import { toCSSUrl } from '@adrise/utils/lib/url';
import classNames from 'classnames';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import ProgramBar, { PROGRAM_WIDTH_PX_PER_MS } from './ProgramBar';
import useInView from '../../hooks/useInView';
var ChannelRow = function (_a) {
    var id = _a.id, containerId = _a.containerId, index = _a.index, thumbnail = _a.thumbnail, landscape = _a.landscape, programs = _a.programs, currentTime = _a.currentTime, startTime = _a.startTime, isActive = _a.isActive, onChannelClick = _a.onChannelClick, onProgramClick = _a.onProgramClick, onProgramInfoClick = _a.onProgramInfoClick, onEnteredView = _a.onEnteredView, shouldShowTimelineProgress = _a.shouldShowTimelineProgress;
    var _b = useInView(), refCallback = _b.refCallback, isInView = _b.isInView;
    var _c = useState(0), hasBeenEnteredViewCount = _c[0], setHasBeenEnteredViewCount = _c[1];
    useEffect(function () {
        if (isInView) {
            setHasBeenEnteredViewCount(hasBeenEnteredViewCount + 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isInView]);
    useEffect(function () {
        if (hasBeenEnteredViewCount) {
            onEnteredView === null || onEnteredView === void 0 ? void 0 : onEnteredView(id, index);
        }
    }, [id, hasBeenEnteredViewCount, onEnteredView, index]);
    var logoImage = isActive ? landscape : thumbnail;
    var clickHandler = useCallback(function (event) {
        event.preventDefault();
        event.stopPropagation();
        onChannelClick === null || onChannelClick === void 0 ? void 0 : onChannelClick(id, containerId);
    }, [containerId, id, onChannelClick]);
    var keydownHandler = useCallback(function (event) {
        if (event.key === 'Enter') {
            onChannelClick === null || onChannelClick === void 0 ? void 0 : onChannelClick(id, containerId);
        }
    }, [containerId, id, onChannelClick]);
    var programBars = useMemo(function () {
        return programs === null || programs === void 0 ? void 0 : programs.map(function (program) {
            var duration;
            var isInProgress;
            var programStartTime = convertToDate(program.startTime);
            var programEndTime = convertToDate(program.endTime);
            if (programStartTime && programEndTime) {
                duration = programEndTime.getTime() - Math.max(programStartTime.getTime(), startTime.getTime());
                isInProgress = currentTime >= programStartTime && currentTime <= programEndTime;
            }
            else {
                isInProgress = true;
            }
            var isProgramActive = isActive && isInProgress;
            return (React.createElement(ProgramBar, __assign({}, program, { containerId: containerId, key: program.programKey, duration: duration, isInProgress: isInProgress, isActive: isProgramActive, onProgramClick: onProgramClick, onInfoClick: onProgramInfoClick })));
        });
    }, [containerId, currentTime, isActive, onProgramClick, onProgramInfoClick, programs, startTime]);
    return (React.createElement("div", { "data-test-id": "web-ui-channel-row", className: "web-epg-row", ref: refCallback },
        React.createElement("div", { className: "web-epg-row__logo", onClick: clickHandler, 
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex: 0, onKeyDown: keydownHandler },
            React.createElement("div", { className: classNames('web-epg-row__logo__image', {
                    'web-epg-row__logo__thumbnail': !isActive,
                    'web-epg-row__logo__landscape': isActive,
                }), style: {
                    backgroundImage: logoImage ? toCSSUrl(logoImage) : undefined,
                } })),
        React.createElement("div", { className: "web-epg-row__programs" },
            programBars,
            React.createElement("div", { className: "web-epg-row__progress", style: __assign({}, (shouldShowTimelineProgress ? { width: "".concat((currentTime.getTime() - startTime.getTime()) * PROGRAM_WIDTH_PX_PER_MS, "px") } : {})) }))));
};
export default memo(ChannelRow);
//# sourceMappingURL=ChannelRow.js.map