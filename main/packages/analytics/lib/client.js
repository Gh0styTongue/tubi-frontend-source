"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserKeys = exports.LocationKeys = exports.ConnectionKeys = exports.DeviceKeys = exports.AppKeys = exports.AppMode = void 0;
// App can be in default or kids mode or espanol mode
// https://github.com/adRise/protos/blob/master/analytics/client.proto#L101-L104
var AppMode;
(function (AppMode) {
    AppMode["DEFAULT_MODE"] = "DEFAULT_MODE";
    AppMode["KIDS_MODE"] = "KIDS_MODE";
    // 'LATINO_MODE' is required for backend
    // but for client side, it is more appropriate to rename it to 'ESPANOL_MODE'
    // see more reasons: https://github.com/adRise/www/pull/7015#pullrequestreview-691380858
    AppMode["ESPANOL_MODE"] = "LATINO_MODE";
})(AppMode = exports.AppMode || (exports.AppMode = {}));
// All properties in App
exports.AppKeys = [
    'platform',
    'app_version',
    'app_version_numeric',
    'app_height',
    'app_width',
    'hybrid_version',
    'app_mode',
];
// Properties for Device message
exports.DeviceKeys = [
    'device_id',
    'manufacturer',
    'model',
    'os',
    'os_version',
    'user_agent',
    'is_mobile',
    'device_width',
    'device_height',
    'advertiser_id',
    'locale',
];
// Properties for Connection message
exports.ConnectionKeys = [
    'network',
    'isp',
    'carrier',
    'nominal_speed',
];
exports.LocationKeys = [
    'latitude',
    'longitude',
    'postal_code',
];
exports.UserKeys = [
    'auth_type',
    'user_id',
];
//# sourceMappingURL=client.js.map