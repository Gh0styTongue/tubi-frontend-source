"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextTick = void 0;
/**
 * run task in next tick
 * @link https://github.com/caolan/async/blob/master/lib/internal/setImmediate.js
 */
var nextTick = function (task) {
    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        process.nextTick(task);
        return;
    }
    // use `global.setImmediate` instead of `setImmediate` to be able to mock it in jest
    if (typeof global.setImmediate === 'function') {
        global.setImmediate(task);
        return;
    }
    // use `global.setTimeout` instead of `setTimeout` to be able to mock it in jest
    global.setTimeout(task, 0);
};
exports.nextTick = nextTick;
//# sourceMappingURL=async.js.map