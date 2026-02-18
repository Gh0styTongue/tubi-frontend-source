import { useRef, useEffect } from 'react';
// @see https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
var useCombinedRefs = function () {
    var refs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        refs[_i] = arguments[_i];
    }
    var targetRef = useRef(null);
    useEffect(function () {
        refs.forEach(function (ref) {
            if (!ref)
                return;
            if (typeof ref === 'function') {
                ref(targetRef.current);
            }
            else {
                // @see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065#issuecomment-547327595
                ref.current = targetRef.current;
            }
        });
    }, [refs]);
    return targetRef;
};
export default useCombinedRefs;
//# sourceMappingURL=useCombinedRefs.js.map