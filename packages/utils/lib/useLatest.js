"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
/** @deprecated Use useLatestForEffect instead (this implementation can cause bugs under concurrent mode because it sets ref.current during render) */
var useLatest = function (value) {
    var ref = (0, react_1.useRef)(value);
    ref.current = value;
    return ref;
};
exports.default = useLatest;
//# sourceMappingURL=useLatest.js.map