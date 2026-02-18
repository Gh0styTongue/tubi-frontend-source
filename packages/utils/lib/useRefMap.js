"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRefMap = exports.createGetChildRef = exports.createRefMapRef = void 0;
var react_1 = require("react");
var createRefMapRef = function () {
    var refMapRef = (0, react_1.createRef)();
    refMapRef.current = new Map();
    return refMapRef;
};
exports.createRefMapRef = createRefMapRef;
var createGetChildRef = function (refMapRef, initialValue) {
    return function (key) {
        var ref = refMapRef.current.get(key);
        if (!ref) {
            ref = (0, react_1.createRef)();
            ref.current = initialValue;
            refMapRef.current.set(key, ref);
        }
        return ref;
    };
};
exports.createGetChildRef = createGetChildRef;
var useRefMap = function (initialValue) {
    var refMapRef = (0, react_1.useMemo)(function () { return (0, exports.createRefMapRef)(); }, []);
    var getRef = (0, react_1.useMemo)(function () { return (0, exports.createGetChildRef)(refMapRef, initialValue); }, [refMapRef, initialValue]);
    return [getRef, refMapRef];
};
exports.useRefMap = useRefMap;
//# sourceMappingURL=useRefMap.js.map