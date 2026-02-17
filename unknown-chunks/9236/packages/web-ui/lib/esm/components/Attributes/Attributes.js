import { Svg4K } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router';
import { AudioDescriptions } from '../AudioDescriptions/AudioDescriptions';
import { Subtitles } from '../Subtitles/Subtitles';
var getSeriesSeasonNum = function (seriesSeasonNum) {
    if (!seriesSeasonNum) {
        return;
    }
    return " ".concat(seriesSeasonNum, " Season").concat(seriesSeasonNum > 1 ? 's' : '');
};
var getTags = function (oneLineAttributes, tags) {
    if (!tags || !oneLineAttributes) {
        return null;
    }
    return Array.isArray(tags) ? tags.join(', ') : tags;
};
var Attributes = function (_a) {
    var badges = _a.badges, _b = _a.is4K, is4K = _b === void 0 ? false : _b, cc = _a.cc, audioDescriptionsAvailable = _a.audioDescriptionsAvailable, label = _a.label, year = _a.year, duration = _a.duration, descriptor = _a.descriptor, rating = _a.rating, tags = _a.tags, channelLogo = _a.channelLogo, channelUrl = _a.channelUrl, channelLogoAltText = _a.channelLogoAltText, timeLeft = _a.timeLeft, subTitle = _a.subTitle, oneLineAttributes = _a.oneLineAttributes, seriesSeasonNum = _a.seriesSeasonNum, isBadgeAfterRating = _a.isBadgeAfterRating, runTime = _a.runTime;
    /* istanbul ignore next */
    return (React.createElement("div", { className: "web-attributes" },
        !oneLineAttributes && !isBadgeAfterRating && badges && badges.length > 0 ? React.createElement("div", { className: "web-attributes__badges" }, badges) : null,
        React.createElement("div", { className: classNames('web-attributes__meta', { 'web-attributes__meta--with-label': !!label }) },
            label,
            subTitle || year || duration || seriesSeasonNum || oneLineAttributes || runTime ? React.createElement("span", { className: "web-attributes__year-duration" }, [subTitle, year, duration, getSeriesSeasonNum(seriesSeasonNum), runTime, getTags(oneLineAttributes, tags)].filter(Boolean).join(' · ')) : null,
            oneLineAttributes && badges && badges.length > 0 ? React.createElement("div", { className: "web-attributes__badges web-attributes__badges--oneline" }, badges) : null,
            is4K ? React.createElement(Svg4K, { className: "web-attributes__4K" }) : null,
            cc ? React.createElement(Subtitles, { className: "web-attributes__subtitles" }) : null,
            audioDescriptionsAvailable ? React.createElement(AudioDescriptions, { className: "web-attributes__ad" }) : null,
            rating ? (React.createElement("div", { className: "web-attributes__rating-descriptor" },
                React.createElement("div", { className: "web-attributes__rating" }, rating ? React.createElement("div", { className: "web-attributes__rating-badge" }, rating) : null),
                descriptor ? React.createElement("div", { className: "web-attributes__descriptor" }, descriptor) : null)) : null,
            isBadgeAfterRating && !oneLineAttributes && badges && badges.length > 0 ? React.createElement("span", null, badges) : null,
            channelLogo && channelUrl ? (React.createElement(Link, { to: channelUrl, className: "web-attributes__channel-link" },
                React.createElement("img", { className: "web-attributes__channel-logo", src: channelLogo, alt: channelLogoAltText }))) : null,
            timeLeft ? React.createElement("span", { className: "web-attributes__time-left" }, timeLeft) : null),
        !oneLineAttributes ? Array.isArray(tags) ? React.createElement("div", null, tags.join(' · ')) : (tags || null) : null));
};
export default Attributes;
//# sourceMappingURL=Attributes.js.map