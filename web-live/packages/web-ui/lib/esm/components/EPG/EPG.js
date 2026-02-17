import { __assign } from "tslib";
import { doSmoothScroll } from '@adrise/utils/lib/animate';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from '@tubitv/icons';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChannelRow from './ChannelRow';
import { PROGRAM_WIDTH_PX_PER_MS } from './ProgramBar';
import Timeline from './Timeline';
import Filter from '../Filter/Filter';
var HEADER_HEIGHT = 180;
// see packages/web-ui/src/components/EPG/EPG.scss @mixin arrowStyles
var ARROW_ICON_HEIGHT = 30;
var CONTAINER_ID_ATTRIBUTE = 'data-container-id';
var MAX_TIMELINE_INCREMENT_COUNT = 20; // advance 20 hours  1 = 1 hour
var useActiveContainerId = function (_a) {
    var containerIds = _a.containerIds, containersRef = _a.containersRef, rootMargin = _a.rootMargin, scrollOffset = _a.scrollOffset;
    var _b = useState(''), activeContainerId = _b[0], setActiveContainerId = _b[1];
    var _c = useState(false), isJumping = _c[0], setIsJumping = _c[1];
    var scrollToContainer = useCallback(function (id) {
        var _a;
        var target = (_a = containersRef.current) === null || _a === void 0 ? void 0 : _a[id];
        if (target) {
            setIsJumping(true);
            doSmoothScroll({
                elementRef: target,
                offset: scrollOffset,
                callback: function () { return setIsJumping(false); },
            });
        }
    }, [containersRef, scrollOffset]);
    // Scroll to the initial active container depending on the url hash
    useEffect(function () {
        var _a;
        var initialActiveContainerId = (_a = window === null || window === void 0 ? void 0 : window.location) === null || _a === void 0 ? void 0 : _a.hash.slice(1);
        if (initialActiveContainerId && containerIds.includes(initialActiveContainerId)) {
            setActiveContainerId(initialActiveContainerId);
            scrollToContainer(initialActiveContainerId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Set the first as the default active container
    useEffect(function () {
        if (activeContainerId === '' && containerIds.length > 0) {
            setActiveContainerId(containerIds[0]);
        }
    }, [activeContainerId, containerIds]);
    // Sync the active container by observing the intersection events between the containers and the top header
    useEffect(function () {
        if (!window.IntersectionObserver || isJumping)
            return;
        var options = {
            root: null,
            rootMargin: "".concat(rootMargin, "px"),
            threshold: 0,
        };
        var observer = new IntersectionObserver(function (entries) {
            var upperIntersections = entries.filter(function (_a) {
                var boundingClientRect = _a.boundingClientRect, rootBounds = _a.rootBounds;
                return boundingClientRect.y < ((rootBounds === null || rootBounds === void 0 ? void 0 : rootBounds.y) || 0);
            });
            var latestChanged = upperIntersections[upperIntersections.length - 1];
            var changedId = latestChanged === null || latestChanged === void 0 ? void 0 : latestChanged.target.getAttribute(CONTAINER_ID_ATTRIBUTE);
            if (latestChanged && latestChanged.intersectionRatio > 0 && changedId) {
                // When scroll down, the active container should be the latest one that has an intersection with the top header
                setActiveContainerId(changedId);
            }
            else if (latestChanged && latestChanged.intersectionRatio === 0) {
                // When scroll up, the active container should be the next of the disappeared one
                var changedIdx = containerIds.findIndex(function (id) { return id === changedId; });
                var nextId = containerIds[changedIdx + 1];
                setActiveContainerId(nextId);
            }
        }, options);
        Object.values(containersRef.current || {}).forEach(function (el) {
            if (el) {
                observer.observe(el);
            }
        });
        return function () {
            observer.disconnect();
        };
    }, [containerIds, containersRef, isJumping, rootMargin]);
    var onContainerSelected = useCallback(function (_a) {
        var id = _a.id;
        setActiveContainerId(id);
        scrollToContainer(id);
        if (window === null || window === void 0 ? void 0 : window.history.replaceState) {
            window.history.replaceState(null, '', "#".concat(id));
        }
    }, [scrollToContainer]);
    return { activeContainerId: activeContainerId, onContainerSelected: onContainerSelected };
};
export var ArrowDirection;
(function (ArrowDirection) {
    ArrowDirection["LEFT"] = "LEFT";
    ArrowDirection["RIGHT"] = "RIGHT";
})(ArrowDirection || (ArrowDirection = {}));
// calculates the CSS `top` `left` `right` values for the position:fixed timeline arrows
// @param element is the channel guide container element
export var getInViewTopPositionForTimelineArrows = function (element, direction) {
    var positionTop = 0;
    var positionLeft = 0;
    var positionRight = 0;
    if (element && typeof window !== 'undefined') {
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;
        var bcr = element.getBoundingClientRect();
        var top_1 = bcr.top;
        var left = bcr.left;
        var right = bcr.right;
        var bottom = bcr.bottom;
        if (bottom < windowHeight) {
            positionTop = Math.max((bottom - HEADER_HEIGHT) / 2) - ARROW_ICON_HEIGHT + HEADER_HEIGHT;
        }
        else if (top_1 < HEADER_HEIGHT) {
            positionTop = Math.max((windowHeight - HEADER_HEIGHT) / 2) - ARROW_ICON_HEIGHT + HEADER_HEIGHT;
        }
        else {
            positionTop = Math.max((windowHeight - top_1) / 2) - ARROW_ICON_HEIGHT + top_1;
        }
        if (direction === ArrowDirection.LEFT) {
            positionLeft = left + 170;
        }
        if (direction === ArrowDirection.RIGHT) {
            positionRight = windowWidth - right - ARROW_ICON_HEIGHT / 2;
        }
    }
    return {
        top: positionTop,
        left: positionLeft,
        right: positionRight,
    };
};
// Due to the positioning of the timeline arrows changing rapidly when the user scrolls the EPG channel guide
// setting the CSS values directly on the dom element will save on needless React re-renders
export var showLeftArrowElement = function (element, channelsRefElement) {
    if (!element || !channelsRefElement)
        return;
    element.style.top = "".concat(getInViewTopPositionForTimelineArrows(channelsRefElement, ArrowDirection.LEFT).top, "px");
    element.style.left = "".concat(getInViewTopPositionForTimelineArrows(channelsRefElement, ArrowDirection.LEFT).left, "px");
    element.style.display = 'flex';
};
export var showRightArrowElement = function (element, channelsRefElement) {
    if (!element || !channelsRefElement)
        return;
    element.style.top = "".concat(getInViewTopPositionForTimelineArrows(channelsRefElement, ArrowDirection.RIGHT).top, "px");
    element.style.right = "".concat(getInViewTopPositionForTimelineArrows(channelsRefElement, ArrowDirection.RIGHT).right, "px");
    element.style.display = 'flex';
};
export var hideArrowElement = function (element) {
    if (!element)
        return;
    element.style.display = 'none';
};
var EPG = function (_a) {
    var activeChannelId = _a.activeChannelId, containers = _a.containers, channelInfoById = _a.channelInfoById, _b = _a.rootMarginOffset, rootMarginOffset = _b === void 0 ? 0 : _b, currentTime = _a.currentTime, startTime = _a.startTime, endTime = _a.endTime, timeFormatter = _a.timeFormatter, onChannelClick = _a.onChannelClick, onProgramClick = _a.onProgramClick, onProgramInfoClick = _a.onProgramInfoClick, onFilterClick = _a.onFilterClick, onChannelEnteredView = _a.onChannelEnteredView, backToLiveCTAText = _a.backToLiveCTAText, onAdvanceTimeline = _a.onAdvanceTimeline, onRetreatTimeline = _a.onRetreatTimeline, onTimelineBackToLive = _a.onTimelineBackToLive, advancedTimeCounter = _a.advancedTimeCounter;
    var containerIds = useMemo(function () { return containers.map(function (_a) {
        var id = _a.id;
        return id;
    }); }, [containers]);
    var containersRef = useRef({});
    var channelsRef = useRef(null);
    var leftArrowRef = useRef(null);
    var rightArrowRef = useRef(null);
    var headerRef = useRef(null);
    var _c = useActiveContainerId({
        containerIds: containerIds,
        containersRef: containersRef,
        // rootMarginOffset is needed when there is margin between the top header and the viewport top, currently only for the storybook
        rootMargin: -(HEADER_HEIGHT + rootMarginOffset),
        scrollOffset: HEADER_HEIGHT,
    }), activeContainerId = _c.activeContainerId, onContainerSelected = _c.onContainerSelected;
    // Add background when header is "stuck" on the top
    useEffect(function () {
        if (!window.IntersectionObserver)
            return;
        var el = headerRef.current;
        var observer = new IntersectionObserver(function (_a) {
            var e = _a[0];
            e.target.classList.toggle('stuck', e.intersectionRatio < 1);
        }, {
            rootMargin: '-1px 0px 0px 0px',
            threshold: [1],
        });
        if (el) {
            observer.observe(el);
        }
        return function () {
            observer.disconnect();
        };
    }, []);
    var channelRows = useMemo(function () {
        var index = 0;
        return containers.map(function (_a) {
            var _b;
            var containerId = _a.id, channelIds = _a.channelIds;
            var rows = channelIds.map(function (channelId) { return (React.createElement(ChannelRow, __assign({}, channelInfoById[channelId], { key: channelId, containerId: containerId, index: index++, currentTime: currentTime, startTime: startTime, isActive: channelId === activeChannelId, onChannelClick: onChannelClick, onProgramClick: onProgramClick, onProgramInfoClick: onProgramInfoClick, onEnteredView: onChannelEnteredView, shouldShowTimelineProgress: advancedTimeCounter < 1 }))); });
            // We set the container it to attributes to get it from the intersection events above
            var attributes = (_b = {}, _b[CONTAINER_ID_ATTRIBUTE] = containerId, _b);
            return (React.createElement("div", __assign({}, attributes, { key: containerId, ref: function (el) { return (containersRef.current[containerId] = el); } }), rows));
        });
    }, [
        activeChannelId,
        containers,
        channelInfoById,
        containersRef,
        currentTime,
        onChannelClick,
        onProgramClick,
        onProgramInfoClick,
        onChannelEnteredView,
        startTime,
        advancedTimeCounter,
    ]);
    var filterItems = useMemo(function () {
        return containers.map(function (_a) {
            var id = _a.id, name = _a.name;
            return ({
                id: id,
                content: name,
            });
        });
    }, [containers]);
    var filterSelectedIds = useMemo(function () { return [activeContainerId]; }, [activeContainerId]);
    var onFilterSelected = useCallback(function (item) {
        onContainerSelected(item);
        onFilterClick === null || onFilterClick === void 0 ? void 0 : onFilterClick(item);
    }, [onContainerSelected, onFilterClick]);
    // NOTE: In general we should be throttling/debouncing scroll events for performance reasons
    // In this use case we will skip using those functions as the timeline arrow's position should be updated
    // for a smooth experience in the UI
    // The following function will only update the timeline arrows css properties (no dom insertions, no react re renders)
    // https://app.shortcut.com/tubi/story/529230/investigate-a-simpler-way-to-display-the-horizontal-scroll-arrows-on-the-web-epg-page
    var handleScroll = useCallback(function () {
        if (advancedTimeCounter > 0) {
            showLeftArrowElement(leftArrowRef.current, channelsRef.current);
        }
        if (advancedTimeCounter <= MAX_TIMELINE_INCREMENT_COUNT) {
            showRightArrowElement(rightArrowRef.current, channelsRef.current);
        }
    }, [advancedTimeCounter]);
    useEffect(function () {
        if (advancedTimeCounter > 0) {
            showLeftArrowElement(leftArrowRef.current, channelsRef.current);
        }
        if (advancedTimeCounter < 1) {
            hideArrowElement(leftArrowRef.current);
        }
        showRightArrowElement(rightArrowRef.current, channelsRef.current);
        if (advancedTimeCounter > MAX_TIMELINE_INCREMENT_COUNT) {
            hideArrowElement(rightArrowRef.current);
        }
    }, [advancedTimeCounter]);
    useEffect(function () {
        window.addEventListener('scroll', handleScroll);
        return function () {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll, advancedTimeCounter]);
    var backToLiveCTA = useMemo(function () {
        if (advancedTimeCounter < 1) {
            return null;
        }
        return (React.createElement("span", { className: "web-epg__back-to-live", onClick: onTimelineBackToLive },
            React.createElement(ArrowLeft, null),
            "\u00A0",
            backToLiveCTAText));
    }, [onTimelineBackToLive, backToLiveCTAText, advancedTimeCounter]);
    var advanceEpgTimelineCTA = useMemo(function () {
        if (advancedTimeCounter > MAX_TIMELINE_INCREMENT_COUNT) {
            return null;
        }
        return (React.createElement("span", { className: "web-epg__advance-epg-timeline", key: "backtolive", onClick: onAdvanceTimeline },
            React.createElement(ArrowRight, null)));
    }, [onAdvanceTimeline, advancedTimeCounter]);
    var leftArrowTimeline = useMemo(function () {
        return (React.createElement("div", { className: "web-epg__left-arrow-retreat", onClick: onRetreatTimeline, ref: leftArrowRef },
            React.createElement(ChevronLeft, null)));
    }, [onRetreatTimeline]);
    var rightArrowTimeline = useMemo(function () {
        return (React.createElement("div", { className: "web-epg__right-arrow-advance", onClick: onAdvanceTimeline, ref: rightArrowRef },
            React.createElement(ChevronRight, null)));
    }, [onAdvanceTimeline]);
    return (React.createElement("div", { className: "web-epg", id: "web-epg" },
        React.createElement("div", { className: "web-epg__header", ref: headerRef, style: { height: "".concat(HEADER_HEIGHT, "px") } },
            React.createElement("div", { className: "web-epg__filter" },
                React.createElement(Filter, { items: filterItems, selectedIds: filterSelectedIds, onSelected: onFilterSelected })),
            React.createElement("div", { className: "web-epg__timeline-container" },
                backToLiveCTA,
                React.createElement(Timeline, { currentTime: currentTime, startTime: startTime, endTime: endTime, widthPerMs: PROGRAM_WIDTH_PX_PER_MS, timeFormatter: timeFormatter }),
                advanceEpgTimelineCTA)),
        React.createElement("div", { className: "web-epg__channels", ref: channelsRef },
            channelRows,
            leftArrowTimeline,
            rightArrowTimeline)));
};
export default memo(EPG);
//# sourceMappingURL=EPG.js.map