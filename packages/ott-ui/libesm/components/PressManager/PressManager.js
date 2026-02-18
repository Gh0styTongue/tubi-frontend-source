import { __assign } from "tslib";
import last from 'lodash/last';
import pull from 'lodash/pull';
import stubFalse from 'lodash/stubFalse';
import uniqueId from 'lodash/uniqueId';
import React, { useEffect, useRef, useState, } from 'react';
var PressManager = /** @class */ (function () {
    function PressManager() {
    }
    PressManager.emitIsPressingTarget = function (isPressingTarget) {
        for (var _i = 0, _a = this.pressingHandlers; _i < _a.length; _i++) {
            var pressingHandler = _a[_i];
            pressingHandler(isPressingTarget);
        }
    };
    PressManager.press = function () {
        var target = last(PressManager.targets);
        if (target === undefined) {
            return;
        }
        this.waitingForRelease.push({
            target: target,
            time: Date.now(),
        });
        this.emitIsPressingTarget({ target: target, isPressing: true });
    };
    PressManager.release = function () {
        var _this = this;
        var now = Date.now();
        var _loop_1 = function (waitingFor) {
            setTimeout(function () {
                _this.emitIsPressingTarget({ target: waitingFor.target, isPressing: false });
            }, Math.max(0, ((now - waitingFor.time) - 150) * -1));
        };
        for (var _i = 0, _a = this.waitingForRelease; _i < _a.length; _i++) {
            var waitingFor = _a[_i];
            _loop_1(waitingFor);
        }
        this.waitingForRelease = [];
    };
    PressManager.addPressHandler = function (handler) {
        PressManager.removePressHandler(handler);
        PressManager.pressingHandlers.push(handler);
    };
    PressManager.removePressHandler = function (handler) {
        pull(PressManager.pressingHandlers, handler);
    };
    PressManager.addTarget = function (target) {
        PressManager.removeTarget(target);
        PressManager.targets.push(target);
    };
    PressManager.removeTarget = function (target) {
        pull(PressManager.targets, target);
    };
    // Keep a targets array act as stack, press event will effect at the top target.
    PressManager.targets = [];
    PressManager.pressingHandlers = [];
    PressManager.waitingForRelease = [];
    return PressManager;
}());
var UNIQUE_ID_PREFIX = 'press_target_';
export function useIsPressing(props, _a) {
    var _b = _a === void 0 ? {} : _a, 
    // Enable when component did mounted by default.
    _c = _b.enableTarget, 
    // Enable when component did mounted by default.
    enableTarget = _c === void 0 ? function (props, prevProps) { return prevProps === undefined; } : _c, 
    // Never disable by default.
    _d = _b.disableTarget, 
    // Never disable by default.
    disableTarget = _d === void 0 ? stubFalse : _d;
    var uuidRef = useRef(uniqueId(UNIQUE_ID_PREFIX));
    var propsRef = useRef();
    var _e = useState(false), isPressing = _e[0], setIsPressing = _e[1];
    useEffect(function () {
        if (enableTarget(props, propsRef.current))
            PressManager.addTarget(uuidRef.current);
        else if (disableTarget(props, propsRef.current))
            PressManager.removeTarget(uuidRef.current);
        propsRef.current = props;
    }, [disableTarget, enableTarget, props]);
    var uuidRefCurrent = uuidRef.current;
    useEffect(function () {
        var onPressingTarget = function (isPressingTarget) {
            if (isPressingTarget.target === uuidRef.current) {
                setIsPressing(isPressingTarget.isPressing);
            }
        };
        PressManager.addPressHandler(onPressingTarget);
        // Stop subscription and remove from targets when component will unmount.
        return function () {
            PressManager.removeTarget(uuidRefCurrent);
            PressManager.removePressHandler(onPressingTarget);
        };
    }, [uuidRefCurrent]);
    return {
        isPressing: isPressing,
    };
}
// Workaround followed to supports default props of wrapped component: https://github.com/typescript-cheatsheets/react/issues/86#issuecomment-822911042
export function withIsPressing(WrappedComponent, options) {
    if (options === void 0) { options = {}; }
    var displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    var WithIsPressing = function (props) {
        var pressingProps = useIsPressing(props, options);
        return React.createElement(WrappedComponent, __assign({}, (__assign(__assign({}, props), pressingProps))));
    };
    WithIsPressing.displayName = "WithIsPressing(".concat(displayName, ")");
    return WithIsPressing;
}
export default PressManager;
//# sourceMappingURL=PressManager.js.map