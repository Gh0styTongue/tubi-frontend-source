"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = exports.ActionStatus = exports.Manipulation = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType["UNKNOWN_USER_TYPE"] = "UNKNOWN_USER_TYPE";
    UserType["EXISTING_USER"] = "EXISTING_USER";
    UserType["NEW_FB"] = "NEW_FB";
})(UserType = exports.UserType || (exports.UserType = {}));
var Manipulation;
(function (Manipulation) {
    Manipulation["UNKNOWN"] = "UNKNOWN";
    Manipulation["LINK"] = "LINK";
    Manipulation["SIGNUP"] = "SIGNUP";
    Manipulation["SIGNIN"] = "SIGNIN";
    Manipulation["CHANGEPW"] = "CHANGEPW";
    Manipulation["REGISTER_DEVICE"] = "REGISTER_DEVICE";
    Manipulation["SIGNOUT"] = "SIGNOUT";
})(Manipulation = exports.Manipulation || (exports.Manipulation = {}));
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["UNKNOWN_ACTION_STATUS"] = "UNKNOWN_ACTION_STATUS";
    ActionStatus["SUCCESS"] = "SUCCESS";
    ActionStatus["FAIL"] = "FAIL";
})(ActionStatus = exports.ActionStatus || (exports.ActionStatus = {}));
var Messages;
(function (Messages) {
    Messages["ERROR"] = "ERROR";
    Messages["SUCCESS"] = "SUCCESS";
    Messages["INVALID_CODE_ERROR"] = "Invalid Code Error";
    Messages["COPPA_FAIL"] = "COPPA Fail";
    Messages["INVALID_PASSWORD"] = "invalid_password";
})(Messages = exports.Messages || (exports.Messages = {}));
//# sourceMappingURL=authEvent.js.map