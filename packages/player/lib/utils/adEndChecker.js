"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdEndChecker = void 0;
var AdEndChecker = /** @class */ (function () {
    function AdEndChecker() {
        var _this = this;
        this.emitMissedEnd = function () {
            var _a;
            (_a = _this.onMissedEnd) === null || _a === void 0 ? void 0 : _a.call(_this);
        };
        // event names which will be used
        // to trigger timeout event when
        // the value of video.currentTime
        // is within one second of video.duration
        this.potentialEndedTriggers = [
            'waiting',
            'stalled',
            'pause',
            'play',
            'timeupdate',
        ];
        this.onPotentiallyEnded = function () {
            if (_this.videoElement === undefined ||
                isNaN(_this.videoElement.duration) ||
                _this.videoElement.currentTime > _this.videoElement.duration ||
                _this.videoElement.duration - _this.videoElement.currentTime >= 1) {
                return;
            }
            clearTimeout(_this.waitingForEndedTimeout);
            _this.waitingForEndedTimeout = setTimeout(_this.emitMissedEnd, 2000);
        };
        this.destroy = function () {
            clearTimeout(_this.waitingForEndedTimeout);
            _this.onMissedEnd = undefined;
            if (_this.videoElement === undefined) {
                return;
            }
            for (var _i = 0, _a = _this.potentialEndedTriggers; _i < _a.length; _i++) {
                var potentialEndedTrigger = _a[_i];
                _this.videoElement.removeEventListener(potentialEndedTrigger, _this.onPotentiallyEnded);
            }
            _this.videoElement.removeEventListener('ended', _this.destroy);
            _this.videoElement = undefined;
        };
    }
    AdEndChecker.prototype.start = function (videoElement, onMissedEnd) {
        this.destroy();
        this.onMissedEnd = onMissedEnd;
        this.videoElement = videoElement;
        for (var _i = 0, _a = this.potentialEndedTriggers; _i < _a.length; _i++) {
            var potentialEndedTrigger = _a[_i];
            this.videoElement.addEventListener(potentialEndedTrigger, this.onPotentiallyEnded);
        }
        this.videoElement.addEventListener('ended', this.destroy);
    };
    return AdEndChecker;
}());
exports.AdEndChecker = AdEndChecker;
//# sourceMappingURL=adEndChecker.js.map