"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbrConfig = void 0;
var tslib_1 = require("tslib");
var AbrRuleMode = {
    NOT_USE_CUSTOM_ABR_CONTROLLER: 0,
    USE_HLSJS_RULE_IN_CUSTOM_ABR_CONTROLLER: 1,
    USE_ALL_COMBINATION_RULES: 2,
    USE_COMBINATION_RULES_EXCEPT_FOR_INSUFFICIENT_BUFFER_RULE: 3,
};
var getAbrConfig = function (options, HlsCls) {
    var defaultAbrConfig = HlsCls.DefaultConfig.abrConfig;
    var abrConfig = tslib_1.__assign({}, defaultAbrConfig);
    var rules = abrConfig.rules;
    if (options.abrRuleMode) {
        switch (options.abrRuleMode) {
            case AbrRuleMode.USE_ALL_COMBINATION_RULES:
                // use all combination rules
                break;
            case AbrRuleMode.USE_COMBINATION_RULES_EXCEPT_FOR_INSUFFICIENT_BUFFER_RULE:
                // use combination rules except for insufficient buffer rule
                rules.insufficientBufferRule.active = false;
                break;
            default:
                // use hlsjs rule
                rules.hlsjsRule.active = true;
                ['throughputRule', 'bolaRule', 'insufficientBufferRule', 'switchHistoryRule'].forEach(function (rule) {
                    rules[rule].active = false;
                });
                break;
        }
    }
    return abrConfig;
};
exports.getAbrConfig = getAbrConfig;
//# sourceMappingURL=abrConfigSetting.js.map