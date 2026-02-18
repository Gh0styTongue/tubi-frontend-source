"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ua_parser_js_1 = require("ua-parser-js");
var ua = new ua_parser_js_1.UAParser(undefined, {
    // This adds a custom extension so that it can recognize the PlayStation 5 until they add official support down
    // the track. Tim has a PR for this which has not been merged yet: https://github.com/faisalman/ua-parser-js/pull/430
    device: [
        [/(playstation\s5)/i],
        [
            ua_parser_js_1.UAParser.DEVICE.MODEL,
            [ua_parser_js_1.UAParser.DEVICE.VENDOR, 'Sony'],
            [ua_parser_js_1.UAParser.DEVICE.TYPE, ua_parser_js_1.UAParser.DEVICE.CONSOLE],
        ],
    ],
    os: [
        [/(playstation)\s(5)/i],
        [
            ua_parser_js_1.UAParser.OS.NAME,
            ua_parser_js_1.UAParser.OS.VERSION,
        ],
    ],
});
exports.default = (function (useragent) {
    // The if case is hard to test because `window.navigator` is read-only.
    /* istanbul ignore if */
    if (!useragent) {
        try {
            useragent = window.navigator.userAgent;
        }
        catch (_a) {
            useragent = '';
        }
    }
    return ua.setUA(useragent).getResult();
});
//# sourceMappingURL=ua-parser.js.map