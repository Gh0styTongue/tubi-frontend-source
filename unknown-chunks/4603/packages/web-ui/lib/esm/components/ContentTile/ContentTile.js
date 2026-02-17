import { __assign } from "tslib";
import { Svg4K as FourKIcon, ThumbUpStroke, ThumbUpFilled, LockFilled24 } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useState, memo, forwardRef, useRef, useEffect } from 'react';
import TilePreview from './TilePreview';
import { bemBlock } from '../../utils/bem';
import EnterExitTransition from '../EnterExitTransition/EnterExitTransition';
import IconButton from '../IconButton/IconButton';
import PlayButton from '../PlayButton/PlayButton';
import Poster from '../Poster/Poster';
import Rating from '../Rating/Rating';
var ContentTile = forwardRef(function (_a, ref) {
    var href = _a.href, title = _a.title, subTitle = _a.subTitle, linkTitle = _a.linkTitle, _b = _a.tags, tags = _b === void 0 ? [] : _b, _c = _a.labelPosition, labelPosition = _c === void 0 ? 'top-left' : _c, description = _a.description, label = _a.label, _d = _a.myListStatus, myListStatus = _d === void 0 ? 'unavailable' : _d, posterSrc = _a.posterSrc, posterSrcSet = _a.posterSrcSet, posterSizes = _a.posterSizes, thumbnailSrc = _a.thumbnailSrc, thumbnailSrcSet = _a.thumbnailSrcSet, thumbnailSizes = _a.thumbnailSizes, _e = _a.tileOrientation, tileOrientation = _e === void 0 ? 'portrait' : _e, rating = _a.rating, _f = _a.ratingPosition, ratingPosition = _f === void 0 ? 'year-duration-row' : _f, descriptor = _a.descriptor, className = _a.className, style = _a.style, progress = _a.progress, canRemoveFromHistory = _a.canRemoveFromHistory, year = _a.year, duration = _a.duration, timeLeft = _a.timeLeft, _g = _a.is4K, is4K = _g === void 0 ? false : _g, onClick = _a.onClick, onMyListUpdate = _a.onMyListUpdate, onPlayClick = _a.onPlayClick, onRemoveFromHistoryClick = _a.onRemoveFromHistoryClick, _h = _a.lazyActive, lazyActive = _h === void 0 ? true : _h, removeFromHistoryLabel = _a.removeFromHistoryLabel, addToMyListLabel = _a.addToMyListLabel, removeFromMyListLabel = _a.removeFromMyListLabel, setReminderLabel = _a.setReminderLabel, removeReminderLabel = _a.removeReminderLabel, comingSoonLabel = _a.comingSoonLabel, playLabel = _a.playLabel, previewAnchor = _a.previewAnchor, isPreviewEnabled = _a.isPreviewEnabled, previewBackgroundImageSrc = _a.previewBackgroundImageSrc, renderPreviewPlayer = _a.renderPreviewPlayer, onPreviewEnter = _a.onPreviewEnter, onPreviewExit = _a.onPreviewExit, isComingSoon = _a.isComingSoon, _j = _a.renderTitle, renderTitle = _j === void 0 ? function (title) { return title; } : _j, fetchPriority = _a.fetchPriority, lazyLoad = _a.lazyLoad, preload = _a.preload, isLikedSelectableTile = _a.isLikedSelectableTile, onLikeClick = _a.onLikeClick, shouldShowDetailsOnMobile = _a.shouldShowDetailsOnMobile, hideDetails = _a.hideDetails, hideMetadata = _a.hideMetadata, isLocked = _a.isLocked, isMobileDevice = _a.isMobileDevice;
    var _k = useState(false), isHovered = _k[0], setIsHovered = _k[1];
    var _l = useState(false), hasBeenHovered = _l[0], setHasBeenHovered = _l[1];
    var _m = useState(false), showPreview = _m[0], setShowPreview = _m[1];
    var _o = useState(false), liked = _o[0], setLikedStatus = _o[1];
    var previewTimeOut = useRef();
    var toggleLikeState = useCallback(function () {
        setLikedStatus(!liked);
        onLikeClick === null || onLikeClick === void 0 ? void 0 : onLikeClick(!liked);
    }, [liked, onLikeClick]);
    var mouseEnterHandler = useCallback(function () {
        setIsHovered(true);
        setHasBeenHovered(true);
        if (isPreviewEnabled) {
            // delay 500ms before the preview shows up in case the user just move over quickly
            previewTimeOut.current = window.setTimeout(function () {
                setShowPreview(true);
            }, 500);
        }
    }, [isPreviewEnabled]);
    var mouseLeaveHandler = useCallback(function () {
        setIsHovered(false);
        if (isPreviewEnabled) {
            window.clearTimeout(previewTimeOut.current);
            setShowPreview(false);
        }
    }, [isPreviewEnabled]);
    useEffect(function () {
        return function () {
            window.clearTimeout(previewTimeOut.current);
        };
    }, []);
    var clickHandler = useCallback(function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (isLikedSelectableTile) {
            toggleLikeState();
        }
        else {
            onClick === null || onClick === void 0 ? void 0 : onClick();
        }
    }, [isLikedSelectableTile, onClick, toggleLikeState]);
    var addToListClickHandler = useCallback(function (event) {
        event.preventDefault();
        event.stopPropagation();
        switch (myListStatus) {
            case 'inList':
                onMyListUpdate === null || onMyListUpdate === void 0 ? void 0 : onMyListUpdate(false);
                break;
            case 'notInList':
                onMyListUpdate === null || onMyListUpdate === void 0 ? void 0 : onMyListUpdate(true);
                break;
            default:
                break;
        }
    }, [myListStatus, onMyListUpdate]);
    var removeFromHistoryClickHandler = useCallback(function (event) {
        event.stopPropagation();
        onRemoveFromHistoryClick === null || onRemoveFromHistoryClick === void 0 ? void 0 : onRemoveFromHistoryClick();
    }, [onRemoveFromHistoryClick]);
    var isPortrait = tileOrientation === 'portrait';
    var src = isPortrait ? posterSrc : thumbnailSrc;
    var srcSet = isPortrait ? posterSrcSet : thumbnailSrcSet;
    var sizes = isPortrait ? posterSizes : thumbnailSizes;
    var bem = bemBlock('web-content-tile');
    var hoverRevealed = hasBeenHovered && lazyActive;
    var hasExtraActions = !isLikedSelectableTile && (myListStatus !== 'unavailable' || canRemoveFromHistory);
    var showYearDurationRow = !!subTitle || !!year || !!duration || (!!rating && ratingPosition === 'year-duration-row') || !!timeLeft;
    /* 4K indicator is displayed alongside the tags */
    var showTagsRow = is4K || (tags === null || tags === void 0 ? void 0 : tags.length) > 0 || (!!rating && ratingPosition === 'tags-row');
    var zoomPoster = isHovered && !isPreviewEnabled && !isLocked;
    var ratingComponent = (React.createElement("div", { className: "web-content-tile__rating" },
        rating ? React.createElement(Rating, null, rating) : null,
        descriptor ? React.createElement("div", { className: bem.element('descriptor') }, descriptor) : null));
    var tilePreviewRef = useRef(null);
    var extraInfoClass = {
        'web-content-tile__show_details_on_mobile': shouldShowDetailsOnMobile,
        'web-content-tile__hide_details': hideDetails,
    };
    var linkProps = {
        className: 'web-content-tile__title',
        href: href,
        title: linkTitle,
    };
    return (React.createElement("div", { "data-test-id": "web-ui-content-tile", ref: ref, className: classNames('web-content-tile', className), style: style, onClick: clickHandler, 
        // should not bind mouse events at mobile devices
        onMouseEnter: isMobileDevice ? undefined : mouseEnterHandler, onMouseLeave: isMobileDevice ? undefined : mouseLeaveHandler },
        React.createElement("div", { className: "web-content-tile__container" },
            React.createElement("div", { className: "web-content-tile__poster" },
                React.createElement(Poster, { alt: title, zoom: zoomPoster, tileOrientation: tileOrientation, progress: progress, hideProgress: zoomPoster && hasExtraActions, src: src, srcSet: srcSet, sizes: sizes, fetchPriority: fetchPriority, lazyActive: lazyActive, lazyLoad: lazyLoad, preload: preload }),
                label ? (React.createElement("div", { className: classNames("web-content-tile__label-".concat(labelPosition), {
                        'web-content-tile__label-with-progress-below': progress,
                    }) }, label)) : null,
                !isMobileDevice && isHovered && isLocked ? (React.createElement("div", { className: classNames('web-content-tile__poster-overlay', {
                        'web-content-tile__poster-overlay-visible': true,
                        'web-content-tile__poster-overlay-locked': true,
                    }) },
                    React.createElement("i", { className: "web-content-tile__locked-icon" },
                        React.createElement(LockFilled24, null)))) : null,
                hoverRevealed && !isPreviewEnabled && !isLocked ? (React.createElement("div", { className: classNames('web-content-tile__poster-overlay', {
                        'web-content-tile__poster-overlay-visible': isLikedSelectableTile && liked,
                    }) },
                    isLikedSelectableTile ? (!liked ? (React.createElement(IconButton, { containerClassName: "web-content-tile__like-button-container", className: "web-content-tile__like-button", icon: React.createElement(ThumbUpStroke, null), onClick: toggleLikeState })) : (React.createElement(IconButton, { containerClassName: "web-content-tile__like-button-container", className: "web-content-tile__like-button", icon: React.createElement(ThumbUpFilled, null), onClick: toggleLikeState }))) : (React.createElement(PlayButton, { onClick: onPlayClick })),
                    hasExtraActions ? (React.createElement("ul", { className: "web-content-tile__extra-actions" },
                        React.createElement("div", { className: bem.element('extra-actions-backdrop') }, src || srcSet ? React.createElement("img", { src: src, srcSet: srcSet, sizes: sizes }) : null),
                        myListStatus !== 'unavailable' ? (React.createElement("li", { className: "web-content-tile__extra-actions-item", onClick: addToListClickHandler }, myListStatus === 'inList' ? removeFromMyListLabel : addToMyListLabel)) : null,
                        canRemoveFromHistory ? (React.createElement("li", { className: "web-content-tile__extra-actions-item", onClick: removeFromHistoryClickHandler }, removeFromHistoryLabel)) : null)) : null)) : null,
                isPreviewEnabled ? (React.createElement("div", { className: classNames('web-content-tile__preview', {
                        'web-content-tile__preview-left': previewAnchor === 'left',
                        'web-content-tile__preview-right': previewAnchor === 'right',
                        'web-content-tile__preview-landscape': tileOrientation === 'landscape',
                    }) },
                    React.createElement(EnterExitTransition, { in: showPreview, entranceTransition: "slideInUp", exitTransition: "slideOutDown", mountOnEnter: true, unmountOnExit: true, nodeRef: tilePreviewRef },
                        React.createElement(TilePreview, { ref: tilePreviewRef, title: title, href: href, backgroundImageSrc: previewBackgroundImageSrc, posterSrc: posterSrc, tileOrientation: tileOrientation, label: label, addToMyListLabel: addToMyListLabel, removeFromMyListLabel: removeFromMyListLabel, removeFromHistoryLabel: removeFromHistoryLabel, setReminderLabel: setReminderLabel, removeReminderLabel: removeReminderLabel, playLabel: playLabel, myListStatus: myListStatus, addToListClickHandler: addToListClickHandler, canRemoveFromHistory: canRemoveFromHistory, removeFromHistoryClickHandler: removeFromHistoryClickHandler, onPlayClick: onPlayClick, renderPreviewPlayer: renderPreviewPlayer, onPreviewEnter: onPreviewEnter, onPreviewExit: onPreviewExit, isComingSoon: isComingSoon })))) : null),
            React.createElement("div", { className: "web-content-tile__content-info" },
                comingSoonLabel ? React.createElement("div", { className: "web-content-tile__coming-soon" }, comingSoonLabel) : null,
                React.createElement("div", { className: classNames('web-content-tile__content-digest', {
                        'web-content-tile__content-digest__hide': hideMetadata,
                    }) },
                    React.createElement("a", __assign({}, linkProps), renderTitle(title)),
                    showYearDurationRow ? (React.createElement("div", { className: classNames('web-content-tile__year-duration', extraInfoClass) },
                        subTitle ? React.createElement("div", { className: "web-content-tile__sub-title" }, subTitle) : null,
                        year ? React.createElement("div", { className: "web-content-tile__year" }, year) : null,
                        duration ? React.createElement("div", { className: "web-content-tile__duration" }, duration) : null,
                        timeLeft ? React.createElement("div", { className: "web-content-tile__time-left" }, timeLeft) : null,
                        ratingPosition === 'year-duration-row' ? ratingComponent : null)) : null,
                    showTagsRow ? (React.createElement("div", { className: classNames('web-content-tile__tags-row', extraInfoClass) },
                        is4K ? React.createElement(FourKIcon, { className: "web-content-tile__4K" }) : null,
                        React.createElement("div", { className: "web-content-tile__tags" }, tags.map(function (tag, i) { return (i > 0 ? "\u00A0\u00B7\u00A0".concat(tag) : tag); })),
                        ratingPosition === 'tags-row' ? ratingComponent : null)) : null,
                    description ? React.createElement("div", { className: "web-content-tile__description" }, description) : null)))));
});
ContentTile.displayName = 'ContentTile';
export default memo(ContentTile);
//# sourceMappingURL=ContentTile.js.map