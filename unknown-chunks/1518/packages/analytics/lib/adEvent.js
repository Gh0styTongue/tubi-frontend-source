"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitType = exports.Reason = exports.AdType = void 0;
var AdType;
(function (AdType) {
    AdType["UNKNOWN"] = "UNKNOWN";
    AdType["VAST"] = "VAST";
    AdType["VPAID"] = "VPAID";
    AdType["INNOVID"] = "INNOVID";
    AdType["BRIGHTLINE"] = "BRIGHTLINE";
    AdType["WRAPPER"] = "WRAPPER";
})(AdType = exports.AdType || (exports.AdType = {}));
var Reason;
(function (Reason) {
    Reason["UNKNOWN_REASON"] = "UNKNOWN_REASON";
    Reason["INFERRED"] = "INFERRED";
    Reason["DETECTED"] = "DETECTED";
})(Reason = exports.Reason || (exports.Reason = {}));
var ExitType;
(function (ExitType) {
    ExitType["UNKNOWN"] = "UNKNOWN";
    ExitType["AUTO"] = "AUTO";
    ExitType["DELIBERATE"] = "DELIBERATE";
})(ExitType = exports.ExitType || (exports.ExitType = {}));
//# sourceMappingURL=adEvent.js.map