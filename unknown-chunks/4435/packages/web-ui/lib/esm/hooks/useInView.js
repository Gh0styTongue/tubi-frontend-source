import debounce from 'lodash/debounce';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
var threshold = Array.from({ length: 10 }, function (e, i) { return i / 10; }); // [0, 0.1, 0.2 ... 0.9]
var useInView = function (options) {
    var elementRef = useRef(null);
    var refCallback = useCallback(function (node) {
        elementRef.current = node;
    }, []);
    var _a = options || {}, _b = _a.rootMargin, rootMargin = _b === void 0 ? '0px' : _b, _c = _a.minVisibilityRatio, minVisibilityRatio = _c === void 0 ? 0 : _c, _d = _a.debounceWait, debounceWait = _d === void 0 ? 250 : _d;
    var observerRef = useRef(null);
    var _e = useState(false), isInView = _e[0], setIsInView = _e[1];
    var debouncedSetIsInView = useMemo(function () { return debounce(setIsInView, debounceWait); }, [debounceWait]);
    useEffect(function () {
        var _a;
        if (!window.IntersectionObserver || !elementRef.current)
            return;
        (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        var observerOptions = {
            root: null,
            rootMargin: rootMargin,
            threshold: threshold,
        };
        observerRef.current = new IntersectionObserver(function (entries) {
            debouncedSetIsInView(entries.some(function (entry) { return entry.intersectionRatio > minVisibilityRatio; }));
        }, observerOptions);
        observerRef.current.observe(elementRef.current);
        return function () {
            var _a;
            (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        };
    }, [debouncedSetIsInView, minVisibilityRatio, rootMargin]);
    return { refCallback: refCallback, isInView: isInView };
};
export default useInView;
//# sourceMappingURL=useInView.js.map