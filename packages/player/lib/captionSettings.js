"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebCaptionSettingsState = void 0;
function isWebCaptionSettingsState(state) {
    if (state === void 0) { state = {}; }
    var typedState = state;
    return (typedState &&
        typedState.defaultCaptions !== undefined &&
        typedState.background !== undefined &&
        typedState.font !== undefined &&
        typedState.styling !== undefined &&
        typedState.window !== undefined);
}
exports.isWebCaptionSettingsState = isWebCaptionSettingsState;
//# sourceMappingURL=captionSettings.js.map