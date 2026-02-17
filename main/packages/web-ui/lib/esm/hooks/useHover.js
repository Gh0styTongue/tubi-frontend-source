import { useState, useCallback, useRef } from 'react';
/**
 * A hook that can be used to update components declaratively based on an
 * element hover state without CSS.
 *
 * @returns A pair of `[callbackRef, isHovered]`. The callback ref should be
 * passed as a ref prop to an element.
 *
 * Adapted from https://codesandbox.io/s/recursing-goldberg-7mtvc
 */
export function useHover(config) {
    var _a = useState(false), value = _a[0], setValue = _a[1];
    var timeOut = useRef();
    var handleMouseEnter = useCallback(function () {
        setValue(true);
        if (timeOut.current) {
            clearTimeout(timeOut.current);
        }
    }, [timeOut]);
    var handleMouseLeave = useCallback(function () {
        if (config === null || config === void 0 ? void 0 : config.delay) {
            timeOut.current = window.setTimeout(function () {
                setValue(false);
            }, config.delay);
        }
        else {
            setValue(false);
        }
    }, [config === null || config === void 0 ? void 0 : config.delay]);
    // Keep track of the last node passed to callbackRef
    // so we can remove its event listeners.
    var ref = useRef();
    // Use a callback ref instead of useEffect so that event listeners
    // get changed in the case that the returned ref gets added to
    // a different element later. With useEffect, changes to ref.current
    // wouldn't cause a rerender and thus the effect would run again.
    var callbackRef = useCallback(function (node) {
        var _a, _b, _c, _d;
        if (config === null || config === void 0 ? void 0 : config.skip) {
            return;
        }
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.removeEventListener('mouseenter', handleMouseEnter);
        (_b = ref.current) === null || _b === void 0 ? void 0 : _b.removeEventListener('mouseleave', handleMouseLeave);
        ref.current = node;
        (_c = ref.current) === null || _c === void 0 ? void 0 : _c.addEventListener('mouseenter', handleMouseEnter);
        (_d = ref.current) === null || _d === void 0 ? void 0 : _d.addEventListener('mouseleave', handleMouseLeave);
    }, [config === null || config === void 0 ? void 0 : config.skip, handleMouseEnter, handleMouseLeave]);
    if (config === null || config === void 0 ? void 0 : config.skip) {
        return [callbackRef, false];
    }
    return [callbackRef, value];
}
export default useHover;
//# sourceMappingURL=useHover.js.map