"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = void 0;
var State;
(function (State) {
    State["idle"] = "idle";
    State["inited"] = "inited";
    // TODO should buffering be a state?
    // buffering = 'buffering',
    State["playing"] = "playing";
    State["paused"] = "paused";
    State["seeking"] = "seeking";
    State["completed"] = "completed";
    State["errored"] = "errored";
    State["destroyed"] = "destroyed";
})(State = exports.State || (exports.State = {}));
//# sourceMappingURL=state.js.map