import { useEffect } from 'react';
export var useTransitionEvent = function (ref, onTransitionStart, onTransitionEnd, onTransitionCancel) {
    // React doesn't support an `onTransitionStart` prop, so we have to manually
    // attach the event listeners to the element.
    useEffect(function () {
        var el = ref.current;
        /* istanbul ignore if */
        if (!el) {
            return;
        }
        if (onTransitionStart) {
            el.addEventListener('transitionstart', onTransitionStart);
        }
        if (onTransitionEnd) {
            el.addEventListener('transitionend', onTransitionEnd);
        }
        if (onTransitionCancel) {
            el.addEventListener('transitioncancel', onTransitionCancel);
        }
        return function () {
            if (onTransitionStart) {
                el.removeEventListener('transitionstart', onTransitionStart);
            }
            if (onTransitionEnd) {
                el.removeEventListener('transitionend', onTransitionEnd);
            }
            if (onTransitionCancel) {
                el.removeEventListener('transitioncancel', onTransitionCancel);
            }
        };
    }, [ref, onTransitionStart, onTransitionEnd, onTransitionCancel]);
};
//# sourceMappingURL=useTransitionEvent.js.map