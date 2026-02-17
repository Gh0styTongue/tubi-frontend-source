"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsRemainingToday = exports.timeDiffInMinutes = exports.timeDiffInSeconds = exports.timeDiffInMilliseconds = exports.isInBreak = exports.isInProgress = exports.programProgress = exports.durationToHourAndMinute = exports.toAMOrPM = exports.isNextDay = exports.isSameDay = exports.convertToDate = exports.ONE_DAY = exports.years = exports.days = exports.hours = exports.mins = exports.secs = exports.now = void 0;
/**
 * Get the current time in millionseconds.
 * Prefer `performance.now` because it has high resolution and is more accurate than `Data.now`.
 * @link https://www.w3.org/TR/hr-time-2/#introduction
 */
var now = function () {
    /* istanbul ignore next */
    return typeof window !== 'undefined' && window.performance ? window.performance.now() : Date.now();
};
exports.now = now;
var secs = function (s) { return Math.round(s * 1000); };
exports.secs = secs;
/** convert minutes to milliseconds */
var mins = function (m) { return (0, exports.secs)(m * 60); };
exports.mins = mins;
var hours = function (h) { return (0, exports.mins)(h * 60); };
exports.hours = hours;
var days = function (d) { return (0, exports.hours)(d * 24); };
exports.days = days;
var years = function (y) { return (0, exports.days)(y * 365.25); };
exports.years = years;
exports.ONE_DAY = (0, exports.days)(1);
var convertToDate = function (time) {
    if (!time)
        return;
    var date = new Date(time);
    if (isNaN(date.getTime()))
        return;
    return date;
};
exports.convertToDate = convertToDate;
var isSameDay = function (d1, d2) {
    return Math.abs(+d1 - +d2) < exports.ONE_DAY
        && d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate();
};
exports.isSameDay = isSameDay;
var isNextDay = function (d1, d2) {
    var nextDay = new Date(d1);
    nextDay.setDate(d1.getDate() + 1);
    return (0, exports.isSameDay)(nextDay, d2);
};
exports.isNextDay = isNextDay;
var toAMOrPM = function (time) {
    var date = (0, exports.convertToDate)(time);
    if (!date)
        return '';
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0".concat(minutes) : minutes;
    return "".concat(hours, ":").concat(minutes, " ").concat(ampm);
};
exports.toAMOrPM = toAMOrPM;
/**
 * Convert 3660 to '1h 1m'
 * @param duration - Seconds of duration
 */
var durationToHourAndMinute = function (duration, hourSuffix, minuteSuffix) {
    var hours = Math.floor(duration / 3600);
    var minutes = Math.ceil(((duration - hours * 3600) / 60));
    if (hours > 1 && hourSuffix) {
        hourSuffix += 's';
    }
    if (minutes > 1 && minuteSuffix) {
        minuteSuffix += 's';
    }
    return "".concat(hours !== 0 ? "".concat(hours).concat(hourSuffix || 'h') : '').concat(hours && minutes ? ' ' : '').concat(minutes !== 0 ? "".concat(minutes).concat(minuteSuffix || 'm') : '');
};
exports.durationToHourAndMinute = durationToHourAndMinute;
/**
 * Get a object contains: duration, elapsed and left time in seconds,
 * progress percentage(>=0 and <=1)
 */
var programProgress = function (startTime, endTime, now) {
    if (now === void 0) { now = new Date(); }
    if (!(0, exports.isInProgress)(startTime, endTime, now))
        return;
    var duration = (0, exports.timeDiffInSeconds)(startTime, endTime);
    var elapsed = (0, exports.timeDiffInSeconds)(startTime, now);
    var left = (0, exports.timeDiffInSeconds)(now, endTime);
    return {
        duration: duration,
        elapsed: elapsed,
        left: left,
        progress: elapsed / duration,
    };
};
exports.programProgress = programProgress;
/**
 * Return true if the latest program is started.
 * Should be complementary to the logic of the isInBreak function
 */
var isInProgress = function (startTime, endTime, now) {
    if (now === void 0) { now = new Date(); }
    var startDate = (0, exports.convertToDate)(startTime);
    var endDate = (0, exports.convertToDate)(endTime);
    if (!startDate || !endDate)
        return false;
    return startDate <= now && now < endDate;
};
exports.isInProgress = isInProgress;
/**
 * Return true if the latest program is not started.
 * Should be complementary to the logic of the isInProgress function
 */
var isInBreak = function (previousEndTime, startTime, now) {
    if (now === void 0) { now = new Date(); }
    var previousEndDate = (0, exports.convertToDate)(previousEndTime);
    var startDate = (0, exports.convertToDate)(startTime);
    if (!previousEndDate || !startDate)
        return false;
    return previousEndDate <= now && now < startDate;
};
exports.isInBreak = isInBreak;
var timeDiffInMilliseconds = function (startTime, endTime) {
    var startDate = (0, exports.convertToDate)(startTime);
    var endDate = (0, exports.convertToDate)(endTime);
    if (!startDate || !endDate)
        return 0;
    var seconds = endDate.getTime() - startDate.getTime();
    return seconds > 0 ? Math.ceil(seconds) : Math.floor(seconds);
};
exports.timeDiffInMilliseconds = timeDiffInMilliseconds;
var timeDiffInSeconds = function (startTime, endTime) {
    var startDate = (0, exports.convertToDate)(startTime);
    var endDate = (0, exports.convertToDate)(endTime);
    if (!startDate || !endDate)
        return 0;
    var diff = endDate.getTime() - startDate.getTime();
    var seconds = diff / 1000;
    return seconds > 0 ? Math.ceil(seconds) : Math.floor(seconds);
};
exports.timeDiffInSeconds = timeDiffInSeconds;
var timeDiffInMinutes = function (startTime, endTime) {
    var startDate = (0, exports.convertToDate)(startTime);
    var endDate = (0, exports.convertToDate)(endTime);
    if (!startDate || !endDate)
        return 0;
    var diff = endDate.getTime() - startDate.getTime();
    var days = diff / 1000 / 60;
    return days > 0 ? Math.ceil(days) : Math.floor(days);
};
exports.timeDiffInMinutes = timeDiffInMinutes;
var secondsRemainingToday = function () {
    var currentTime = new Date();
    var endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    var remainingSeconds = Math.floor((Number(endOfDay) - Number(currentTime)) / 1000);
    return remainingSeconds;
};
exports.secondsRemainingToday = secondsRemainingToday;
//# sourceMappingURL=time.js.map