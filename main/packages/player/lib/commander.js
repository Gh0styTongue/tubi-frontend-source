"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerCommander = void 0;
var tslib_1 = require("tslib");
var TypedEventEmitter_1 = require("@adrise/utils/lib/TypedEventEmitter");
var constants_1 = require("./constants");
/**
 * What commander could do?
A commander is a way to send a command to the running player without fetching the player instance. It's similar to the control actions.  The commander could only provide simple commands for the component except for the player UI. It only contains play/pause now.

Who should use the commander?
If the component is not player related, it hopes to send a command to the player. It should use this. In most cases, these components are modal.

What player has supported this?
We only support this for the live player. You should use the control action for the VOD/Trailer/Preview.
 */
var PlayerCommander = /** @class */ (function (_super) {
    tslib_1.__extends(PlayerCommander, _super);
    function PlayerCommander() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlayerCommander.prototype.play = function () {
        this.emit(constants_1.PLAYER_EVENTS.play);
    };
    PlayerCommander.prototype.pause = function () {
        this.emit(constants_1.PLAYER_EVENTS.pause);
    };
    return PlayerCommander;
}(TypedEventEmitter_1.TypedEventEmitter));
var singleton = new PlayerCommander();
exports.playerCommander = singleton;
//# sourceMappingURL=commander.js.map