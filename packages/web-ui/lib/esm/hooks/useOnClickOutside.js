import { useEffect } from 'react';
var MOUSEDOWN = 'mousedown';
var TOUCHSTART = 'touchstart';
var events = [MOUSEDOWN, TOUCHSTART];
function useOnClickOutside(ref, handler) {
    useEffect(function () {
        var listener = function (event) {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        events.forEach(function (event) {
            document.addEventListener(event, listener);
        });
        return function () {
            events.forEach(function (event) {
                document.removeEventListener(event, listener);
            });
        };
    }, [ref, handler]);
}
export default useOnClickOutside;
//# sourceMappingURL=useOnClickOutside.js.map