"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genUuid = void 0;
exports.genUuid = (function () {
    var counter = 0;
    return function () { return counter++; };
})();
//# sourceMappingURL=utils.js.map