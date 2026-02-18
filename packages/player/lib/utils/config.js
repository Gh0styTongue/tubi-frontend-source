"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetHlsStartPosition = exports.buildHlsConfig = void 0;
var tslib_1 = require("tslib");
var tools_1 = require("./tools");
var constants_1 = require("../constants");
var types_1 = require("../types");
var buildHlsConfig = function (config) {
    var licenseUrl = config.licenseUrl, drmKeySystem = config.drmKeySystem, extensionConfig = config.extensionConfig;
    if (!(0, types_1.isHlsExtensionConfig)(extensionConfig))
        return {};
    var hlsConfig = extensionConfig.hls;
    var drmOptions = {};
    var drmSystems = {};
    if (licenseUrl && drmKeySystem) {
        var licenseUrlOptionKey = drmKeySystem === constants_1.DrmKeySystem.Widevine ? 'widevineLicenseUrl' : 'playreadyLicenseUrl';
        drmOptions[licenseUrlOptionKey] = licenseUrl;
        drmOptions.emeEnabled = true;
        drmSystems[drmKeySystem] = {
            licenseUrl: licenseUrl,
        };
    }
    var resultConfig = tslib_1.__assign(tslib_1.__assign({ 
        // Comcast/Cox boxes consume less memory when web workers are set to false.
        enableWorker: false, 
        // we are setting the max buffer length in seconds at any point in time
        // in this interval (20, 60)
        maxBufferLength: 20, maxMaxBufferLength: 60, shouldRemoveUsedBuffer: true, backBufferLength: 15, debug: config.debugLevel === constants_1.PLAYER_LOG_LEVEL.SDK_LEVEL, drmSystems: drmSystems }, hlsConfig), drmOptions);
    // It's important to remove undefined values from the config object
    // We don't want to send undefined values to the hls.js library since it would override the default values
    return (0, tools_1.removeUndefined)(resultConfig);
};
exports.buildHlsConfig = buildHlsConfig;
var resetHlsStartPosition = function (hls) {
    if (hls.config && hls.config.startPosition >= 0) {
        hls.config.startPosition = -1;
    }
};
exports.resetHlsStartPosition = resetHlsStartPosition;
//# sourceMappingURL=config.js.map