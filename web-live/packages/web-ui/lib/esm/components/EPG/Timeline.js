import { mins } from '@adrise/utils/lib/time';
import { LiveFilled24 } from '@tubitv/icons';
import React, { memo } from 'react';
import Label from '../Label/Label';
var TIMELINE_INTERVAL = mins(30);
var CURRENT_TIME_MARKER_WIDTH_PX = 100;
var Timeline = function (_a) {
    var currentTime = _a.currentTime, startTime = _a.startTime, endTime = _a.endTime, widthPerMs = _a.widthPerMs, _b = _a.interval, interval = _b === void 0 ? TIMELINE_INTERVAL : _b, timeFormatter = _a.timeFormatter;
    var timeMarkerNum = Math.floor((endTime.getTime() - startTime.getTime()) / interval) + 1;
    var timeMarkers = [];
    // The first time label should not be present according to the design
    for (var i = 1; i < timeMarkerNum; i++) {
        var time = new Date(startTime.getTime() + i * interval);
        var translateX = i * interval * widthPerMs;
        var timeMarker = (React.createElement("span", { className: "web-epg-timeline__time-marker", key: "web-epg-timeline__timeline-".concat(i), style: { transform: "translateX(".concat(translateX, "px)") } },
            React.createElement("span", { className: "web-epg-timeline__time-marker__divider" }),
            timeFormatter(time, false)));
        timeMarkers.push(timeMarker);
    }
    return (React.createElement("div", { "data-test-id": "web-ui-timeline", className: "web-epg-timeline" },
        timeMarkers,
        React.createElement("div", { className: "web-epg-timeline__time-marker", style: {
                width: "".concat(CURRENT_TIME_MARKER_WIDTH_PX, "px"),
                transform: "translateX(".concat((currentTime.getTime() - startTime.getTime()) * widthPerMs - CURRENT_TIME_MARKER_WIDTH_PX / 2, "px)"),
            } },
            React.createElement(Label, { icon: React.createElement(LiveFilled24, null), color: "red" }, timeFormatter(currentTime, true)),
            React.createElement("div", { className: "web-epg-timeline__current-line" }))));
};
export default memo(Timeline);
//# sourceMappingURL=Timeline.js.map