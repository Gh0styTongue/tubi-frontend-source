"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var useIsomorphicLayoutEffect_1 = require("./useIsomorphicLayoutEffect");
/**
 * Returns a ref that updates the current value of a variable before any
 * useEffect hooks run so you can be certain that you'll have the latest value
 * when the effects execute.
 *
 * This is like `useLatest`, but it's safe to use with concurrent mode because
 * it doesn't update ref.current during the render phase.
 *
 * @param value - The value to store in the ref
 * @returns
 */
var useLatestForEffect = function (value) {
    var ref = (0, react_1.useRef)(value);
    (0, useIsomorphicLayoutEffect_1.useIsomorphicLayoutEffect)(function () {
        ref.current = value;
    }, [value]);
    return ref;
};
exports.default = useLatestForEffect;
//# sourceMappingURL=useLatestForEffect.js.map