"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mergeWith_1 = __importDefault(require("lodash/mergeWith"));
var uuid = __importStar(require("uuid"));
var client_1 = require("./client");
var utils_1 = require("./utils");
var customizerMerge = function (objValue, srcValue) {
    if (srcValue === null || srcValue === undefined) {
        return objValue;
    }
};
/**
 * Analytics: Used to set and get config and form the base event body for all requests.
 */
var Analytics = /** @class */ (function () {
    function Analytics() {
    }
    /**
     * Merge config accepts both a thunk and
     * a config object and merges it with Analytics.config
     * @param config
     */
    Analytics.mergeConfig = function (config) {
        this.config = (0, mergeWith_1.default)(this.config, typeof config === 'function' ? config() : config, customizerMerge);
    };
    Analytics.getAnalyticsConfig = function () {
        return this.config;
    };
    /**
     * Event request to the analytics endpoint should have the following set of properties as base.
     */
    Analytics.getBaseEventBody = function () {
        return __assign({ user: this.getUser() }, (0, utils_1.pickKeys)(__assign({ request: this.requestConfig(), device: this.getDeviceConfig(), app: this.getAppConfig(), connection: this.getConnection(), location: this.getLocation() }, this.getCurrentISOTimestamp())));
    };
    /**
     * Get timestamp needed for every event
     */
    Analytics.getCurrentISOTimestamp = function () {
        return {
            sent_timestamp: new Date().toISOString(),
        };
    };
    /**
     * Get user properties. This is a required property. Defaults to {}
     */
    Analytics.getUser = function () {
        return (0, utils_1.pickKeys)(this.config, client_1.UserKeys);
    };
    /**
     * Create a new UUID for every event as an identifier to the client request.
     */
    Analytics.requestConfig = function () {
        return {
            key: uuid.v4(),
        };
    };
    /**
     * Device keys like device_id, device_width, device_height etc.
     */
    Analytics.getDeviceConfig = function () {
        return (0, utils_1.pickKeys)(this.config, client_1.DeviceKeys);
    };
    /**
     * App Properties: app_version, app_version_code, app_height, app_width
     */
    Analytics.getAppConfig = function () {
        return (0, utils_1.pickKeys)(this.config, client_1.AppKeys);
    };
    /**
     * Connection Properties. This relates to connection_speed etc.
     */
    Analytics.getConnection = function () {
        return (0, utils_1.pickKeys)(this.config, client_1.ConnectionKeys);
    };
    /**
     * Location Properties. This relates to postal_code etc.
     */
    Analytics.getLocation = function () {
        return (0, utils_1.pickKeys)(this.config, client_1.LocationKeys);
    };
    return Analytics;
}());
exports.default = Analytics;
//# sourceMappingURL=index.js.map