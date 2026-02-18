"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceCollector = exports.EVENT_PRELOADED = exports.EVENT_LOADED_METADATA_TIME = exports.EVENT_LOADED_DATA_TIME = exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADING = exports.EVENT_HLS_AUDIO_FRAG_LOADING = exports.EVENT_HLS_VIDEO_FRAG_LOADING = exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADED = exports.EVENT_HLS_AUDIO_FRAG_LOADED = exports.EVENT_HLS_VIDEO_FRAG_LOADED = exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_BUFFERED = exports.EVENT_HLS_AUDIO_LEVEL_LOADED = exports.EVENT_HLS_VIDEO_LEVEL_LOADED = exports.EVENT_HLS_VIDEO_AUDIO_LEVELS_LOADED = exports.EVENT_MANIFEST_LOADED_TIME = exports.EVENT_STARTUP_RETRY = exports.EVENT_FIRST_FRAME_TIME = void 0;
var tslib_1 = require("tslib");
var time_1 = require("@adrise/utils/lib/time");
var events_1 = require("events");
var tools_1 = require("./tools");
exports.EVENT_FIRST_FRAME_TIME = 'first_frame_time';
exports.EVENT_STARTUP_RETRY = 'startupRetry';
exports.EVENT_MANIFEST_LOADED_TIME = 'manifest_loaded_time';
exports.EVENT_HLS_VIDEO_AUDIO_LEVELS_LOADED = 'variant_loaded_time';
exports.EVENT_HLS_VIDEO_LEVEL_LOADED = 'hlsVideoLevelLoaded';
exports.EVENT_HLS_AUDIO_LEVEL_LOADED = 'hlsAudioLevelLoaded';
exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_BUFFERED = 'frag_buffered_time';
exports.EVENT_HLS_VIDEO_FRAG_LOADED = 'hlsVideoFragLoaded';
exports.EVENT_HLS_AUDIO_FRAG_LOADED = 'hlsAudioFragLoaded';
exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADED = 'frag_loaded_time';
exports.EVENT_HLS_VIDEO_FRAG_LOADING = 'hlsVideoFragLoading';
exports.EVENT_HLS_AUDIO_FRAG_LOADING = 'hlsAudioFragLoading';
exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADING = 'hlsVideoAudioFragsLoading';
exports.EVENT_LOADED_DATA_TIME = 'loaded_data_time';
exports.EVENT_LOADED_METADATA_TIME = 'loaded_metadata_time';
exports.EVENT_PRELOADED = 'preloaded';
var PerformanceCollector = /** @class */ (function (_super) {
    tslib_1.__extends(PerformanceCollector, _super);
    function PerformanceCollector(_a) {
        var _b = _a === void 0 ? {} : _a, ExternalHls = _b.ExternalHls, hlsEventsList = _b.hlsEventsList, videoElementEventsList = _b.videoElementEventsList, debug = _b.debug, reporter = _b.reporter;
        var _this = _super.call(this) || this;
        _this.hlsListenerMap = {};
        _this.videoElementListenerMap = {};
        _this.isReported = false;
        _this.fragBuffered = {
            video: false,
            audio: false,
        };
        _this.fragLoaded = {
            video: false,
            audio: false,
        };
        _this.fragLoading = {
            video: false,
            audio: false,
        };
        _this.levelLoaded = {
            video: false,
            audio: false,
        };
        _this.baseTime = Infinity;
        _this.timeMap = {};
        var defaultHlsEventsList = [];
        if (ExternalHls) {
            _this.ExternalHls = ExternalHls;
            var Events_1 = ExternalHls.Events;
            defaultHlsEventsList = [
                Events_1.MEDIA_ATTACHING,
                Events_1.MEDIA_ATTACHED,
                Events_1.MANIFEST_LOADING,
                Events_1.MANIFEST_LOADED,
                Events_1.MANIFEST_PARSED,
                Events_1.LEVEL_LOADING,
                Events_1.LEVEL_LOADED,
                Events_1.AUDIO_TRACK_LOADING,
                Events_1.AUDIO_TRACK_LOADED,
                Events_1.KEY_LOADING,
                Events_1.KEY_LOADED,
                Events_1.FRAG_LOADING,
                Events_1.FRAG_LOADED,
                Events_1.FRAG_DECRYPTED,
                Events_1.FRAG_PARSING_INIT_SEGMENT,
                Events_1.FRAG_PARSED,
                Events_1.FRAG_BUFFERED,
                Events_1.EME_GENERATE_KEY_SESSION,
                Events_1.EME_ON_KEY_SESSION_MESSAGE,
                Events_1.EME_SESSION_UPDATE,
            ];
        }
        // Hls instance is an empty object on the server-side because the dynamic import is not supported on the SSR.
        _this.HLS_EVENTS_LIST = hlsEventsList !== null && hlsEventsList !== void 0 ? hlsEventsList : defaultHlsEventsList;
        _this.log = debug ? (0, tools_1.debug)('PerformanceCollector') : function () { };
        _this.reporter = reporter;
        _this.VIDEO_ELEMENT_EVENTS_LIST = videoElementEventsList !== null && videoElementEventsList !== void 0 ? videoElementEventsList : [
            'canplay',
            'loadedmetadata',
            'loadeddata',
            'play',
            'timeupdate',
        ];
        _this.setBaseTime((0, time_1.now)());
        _this.generateListenerMap();
        return _this;
    }
    PerformanceCollector.prototype.destroy = function () {
        this.report();
    };
    PerformanceCollector.prototype.setBaseTime = function (baseTime) {
        this.baseTime = baseTime;
    };
    PerformanceCollector.prototype.getBaseTime = function () {
        return this.baseTime;
    };
    PerformanceCollector.prototype.setHls = function (hls) {
        if (this.hls) {
            this.operateHlsEvents(true);
        }
        this.hls = hls;
        this.operateHlsEvents();
    };
    PerformanceCollector.prototype.setVideoElement = function (videoElement) {
        this.videoElement = videoElement;
        this.bindVideoElementEvents();
    };
    PerformanceCollector.prototype.startupRetry = function () {
        // for fallback/reload case, we clear previous detailed startup data and record a total previous time-consuming
        this.clearRecords();
        this.fragLoading = {
            video: false,
            audio: false,
        };
        this.fragLoaded = {
            video: false,
            audio: false,
        };
        this.measure(exports.EVENT_STARTUP_RETRY);
    };
    PerformanceCollector.prototype.operateHlsEvents = function (remove) {
        var _this = this;
        if (remove === void 0) { remove = false; }
        this.HLS_EVENTS_LIST.forEach(function (eventName) {
            var _a;
            var listener = _this.hlsListenerMap[eventName];
            if (!listener)
                return;
            var fnName = remove ? 'off' : 'on';
            var operate = (_a = _this.hls) === null || _a === void 0 ? void 0 : _a[fnName];
            operate === null || operate === void 0 ? void 0 : operate.call(_this.hls, eventName, listener);
        });
    };
    PerformanceCollector.prototype.bindVideoElementEvents = function () {
        var _this = this;
        this.unbindVideoElementEvents();
        this.VIDEO_ELEMENT_EVENTS_LIST.forEach(function (eventName) {
            var _a;
            var fn = function () {
                var videoElement = _this.videoElement;
                /* istanbul ignore if */
                if (!videoElement) {
                    return;
                }
                videoElement.removeEventListener(eventName, fn);
                if (eventName === 'loadeddata') {
                    _this.measure(exports.EVENT_LOADED_DATA_TIME);
                }
                else if (eventName === 'loadedmetadata') {
                    _this.measure(exports.EVENT_LOADED_METADATA_TIME);
                }
                _this.measure(eventName);
                if (eventName === 'loadeddata' || eventName === 'canplay') {
                    _this.measure(exports.EVENT_FIRST_FRAME_TIME);
                    _this.report();
                }
            };
            /* istanbul ignore next */
            (_a = _this.videoElement) === null || _a === void 0 ? void 0 : _a.addEventListener(eventName, fn);
            _this.videoElementListenerMap[eventName] = fn;
        });
    };
    PerformanceCollector.prototype.unbindVideoElementEvents = function () {
        var _this = this;
        this.VIDEO_ELEMENT_EVENTS_LIST.forEach(function (eventName) {
            var _a;
            (_a = _this.videoElement) === null || _a === void 0 ? void 0 : _a.removeEventListener(eventName, _this.videoElementListenerMap[eventName]);
        });
        this.videoElementListenerMap = {};
    };
    PerformanceCollector.prototype.generateListenerMap = function () {
        var _this = this;
        this.HLS_EVENTS_LIST.forEach(function (eventName) {
            _this.hlsListenerMap[eventName] = function (eventName, data) {
                var _a;
                _this.emit(eventName, data);
                var isAVFragMixed = ((_a = _this.hls) === null || _a === void 0 ? void 0 : _a.audioTracks.length) === 0;
                if (eventName === _this.ExternalHls.Events.FRAG_BUFFERED) {
                    if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'audio') {
                        _this.fragBuffered.audio = true;
                    }
                    else if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'main') {
                        _this.fragBuffered.video = true;
                    }
                    if (_this.fragBuffered.video && (_this.fragBuffered.audio || isAVFragMixed)) {
                        _this.measure(exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_BUFFERED);
                    }
                }
                else if (eventName === _this.ExternalHls.Events.FRAG_LOADED) {
                    if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'audio') {
                        _this.fragLoaded.audio = true;
                        _this.measure(exports.EVENT_HLS_AUDIO_FRAG_LOADED);
                    }
                    else if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'main') {
                        _this.fragLoaded.video = true;
                        _this.measure(exports.EVENT_HLS_VIDEO_FRAG_LOADED);
                    }
                    if (_this.fragLoaded.video && (_this.fragLoaded.audio || isAVFragMixed)) {
                        _this.measure(exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADED);
                    }
                }
                else if (eventName === _this.ExternalHls.Events.FRAG_LOADING) {
                    if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'audio') {
                        _this.fragLoading.audio = true;
                        _this.measure(exports.EVENT_HLS_AUDIO_FRAG_LOADING);
                    }
                    else if ((data === null || data === void 0 ? void 0 : data.frag.type) === 'main') {
                        _this.fragLoading.video = true;
                        _this.measure(exports.EVENT_HLS_VIDEO_FRAG_LOADING);
                    }
                    if (_this.fragLoading.video && (_this.fragLoading.audio || isAVFragMixed)) {
                        _this.measure(exports.EVENT_HLS_VIDEO_AUDIO_FRAGS_LOADING);
                    }
                }
                else if (eventName === _this.ExternalHls.Events.MANIFEST_LOADED) {
                    _this.measure(exports.EVENT_MANIFEST_LOADED_TIME);
                    return;
                }
                else if (eventName === _this.ExternalHls.Events.LEVEL_LOADED) {
                    _this.levelLoaded.video = true;
                    _this.measure(exports.EVENT_HLS_VIDEO_LEVEL_LOADED);
                    if (_this.levelLoaded.audio || isAVFragMixed) {
                        _this.measure(exports.EVENT_HLS_VIDEO_AUDIO_LEVELS_LOADED);
                    }
                }
                else if (eventName === _this.ExternalHls.Events.AUDIO_TRACK_LOADED) {
                    _this.levelLoaded.audio = true;
                    _this.measure(exports.EVENT_HLS_AUDIO_LEVEL_LOADED);
                    if (_this.levelLoaded.video) {
                        _this.measure(exports.EVENT_HLS_VIDEO_AUDIO_LEVELS_LOADED);
                    }
                }
                _this.measure(eventName);
            };
        });
    };
    PerformanceCollector.prototype.measure = function (eventName) {
        var currentTime = (0, time_1.now)();
        var duration = parseFloat(Math.max(currentTime - this.baseTime, 0).toFixed(2));
        var name = eventName.replace('hls', ''); // Remove hls prefix to save some space
        // Events.EME_SESSION_UPDATE may be triggered twice before first frame viewed when must need EME, so record the last one
        if (this.timeMap[name] === undefined || eventName === this.ExternalHls.Events.EME_SESSION_UPDATE) {
            this.timeMap[name] = duration;
            this.log("".concat(eventName, ": ").concat(duration));
        }
    };
    PerformanceCollector.prototype.clearRecords = function () {
        this.timeMap = {};
    };
    PerformanceCollector.prototype.report = function () {
        var _a;
        this.operateHlsEvents(true);
        this.unbindVideoElementEvents();
        if (this.isReported) {
            return;
        }
        this.isReported = true;
        (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.call(this, this.timeMap);
    };
    return PerformanceCollector;
}(events_1.EventEmitter));
exports.PerformanceCollector = PerformanceCollector;
//# sourceMappingURL=performanceCollector.js.map