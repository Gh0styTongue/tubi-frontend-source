import { toCSSUrl } from '@adrise/utils/lib/url';
import { MyListFilled, MyListOutline, Trash, BellNotification, BellNotificationFilled, Play, } from '@tubitv/icons';
import classNames from 'classnames';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import IconButton from '../IconButton/IconButton';
import Rating from '../Rating/Rating';
var TilePreview = forwardRef(function (_a, ref) {
    var title = _a.title, artTitle = _a.artTitle, year = _a.year, tags = _a.tags, rating = _a.rating, subTitle = _a.subTitle, duration = _a.duration, season = _a.season, progress = _a.progress, timeLeft = _a.timeLeft, href = _a.href, label = _a.label, backgroundImageSrc = _a.backgroundImageSrc, _b = _a.tileOrientation, tileOrientation = _b === void 0 ? 'portrait' : _b, addToMyListLabel = _a.addToMyListLabel, removeFromMyListLabel = _a.removeFromMyListLabel, setReminderLabel = _a.setReminderLabel, removeReminderLabel = _a.removeReminderLabel, removeFromHistoryLabel = _a.removeFromHistoryLabel, playLabel = _a.playLabel, myListStatus = _a.myListStatus, addToListClickHandler = _a.addToListClickHandler, canRemoveFromHistory = _a.canRemoveFromHistory, removeFromHistoryClickHandler = _a.removeFromHistoryClickHandler, onPlayClick = _a.onPlayClick, renderPreviewPlayer = _a.renderPreviewPlayer, onPreviewEnter = _a.onPreviewEnter, onPreviewExit = _a.onPreviewExit, isComingSoon = _a.isComingSoon, shouldNotShowTitleOnHover = _a.shouldNotShowTitleOnHover;
    useEffect(function () {
        onPreviewEnter === null || onPreviewEnter === void 0 ? void 0 : onPreviewEnter();
        return function () {
            onPreviewExit === null || onPreviewExit === void 0 ? void 0 : onPreviewExit();
        };
    }, [onPreviewEnter, onPreviewExit]);
    var isLandscape = tileOrientation === 'landscape';
    var myListButton = null;
    if (myListStatus !== 'unavailable') {
        var icon = void 0;
        var tooltip = void 0;
        if (isComingSoon) {
            icon = myListStatus === 'inList' ? React.createElement(BellNotificationFilled, null) : React.createElement(BellNotification, null);
            tooltip = myListStatus === 'inList' ? removeReminderLabel : setReminderLabel;
        }
        else {
            icon = myListStatus === 'inList' ? React.createElement(MyListFilled, null) : React.createElement(MyListOutline, null);
            tooltip = myListStatus === 'inList' ? removeFromMyListLabel : addToMyListLabel;
        }
        myListButton = (React.createElement(IconButton, { containerClassName: "web-tile-preview__button-container", className: "web-tile-preview__button", icon: icon, tooltip: tooltip, tooltipTheme: "light", onClick: addToListClickHandler }));
    }
    var hasProgress = typeof progress === 'number';
    var isEpisode = hasProgress && season && subTitle;
    var primaryGenre = tags ? tags[0] : undefined;
    var metadata = '';
    if (hasProgress) {
        metadata = season && subTitle ? subTitle : [
            primaryGenre,
            year,
            subTitle,
        ].filter(Boolean).join(' · ');
    }
    else {
        metadata = [
            primaryGenre,
            year,
            duration || season,
            subTitle,
        ].filter(Boolean).join(' · ');
    }
    var _c = useState(false), artTitleLoaded = _c[0], setArtTitleLoaded = _c[1];
    var onArtTitleLoad = useCallback(function () {
        setArtTitleLoaded(true);
    }, []);
    return (React.createElement("div", { "data-test-id": "web-ui-tile-preview", className: classNames('web-tile-preview', { 'web-tile-preview__landscape': isLandscape }), ref: ref },
        React.createElement("div", { className: "web-tile-preview__player", style: backgroundImageSrc ? { backgroundImage: toCSSUrl(backgroundImageSrc) } : undefined }, renderPreviewPlayer === null || renderPreviewPlayer === void 0 ? void 0 : renderPreviewPlayer()),
        label ? React.createElement("div", { className: "web-tile-preview__label" }, label) : null,
        React.createElement("div", { className: "web-tile-preview__details" },
            artTitle && !shouldNotShowTitleOnHover ? React.createElement("img", { alt: title, className: "web-tile-preview__art-title", src: artTitle, onLoad: onArtTitleLoad }) : null,
            React.createElement("div", { className: "web-tile-preview__content" },
                React.createElement("div", { className: "web-tile-preview__content-info" },
                    !artTitleLoaded && !shouldNotShowTitleOnHover ? React.createElement("a", { href: href, className: "web-tile-preview__title" }, title) : null,
                    React.createElement("div", { className: "web-tile-preview__tags-row" },
                        React.createElement("span", { className: classNames('web-tile-preview__metadata', { 'limit-one-line': isEpisode }) }, metadata),
                        rating ? React.createElement("div", { className: "web-tile-preview__rating" },
                            React.createElement(Rating, null, rating)) : null),
                    hasProgress ?
                        React.createElement("label", { className: "web-tile-preview__time-left" },
                            React.createElement("progress", { value: progress, max: "1" }),
                            timeLeft)
                        : null),
                React.createElement("div", { className: "web-tile-preview__buttons" },
                    canRemoveFromHistory ? (React.createElement(IconButton, { containerClassName: "web-tile-preview__button-container", className: "web-tile-preview__button", icon: React.createElement(Trash, null), tooltip: removeFromHistoryLabel, tooltipTheme: "light", onClick: removeFromHistoryClickHandler })) : null,
                    myListButton,
                    !isComingSoon ? (React.createElement(IconButton, { containerClassName: "web-tile-preview__play-button-container", className: "web-tile-preview__play-button", icon: React.createElement(Play, null), tooltip: playLabel, tooltipTheme: "light", onClick: onPlayClick })) : null)))));
});
export default TilePreview;
//# sourceMappingURL=TilePreview.js.map