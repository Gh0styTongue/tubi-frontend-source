import { __assign } from "tslib";
import { useRef } from 'react';
import getSwipeDirection from '../utils/getSwipeDirection';
function useCarouselSwipe(_a) {
    var onNext = _a.onNext, onPrevious = _a.onPrevious;
    var touchInfo = useRef({});
    var onTouchStart = function (event) {
        if (!event.touches)
            return;
        var _a = event.touches[0], pageX = _a.pageX, pageY = _a.pageY;
        touchInfo.current = {
            startX: pageX,
            startY: pageY,
        };
    };
    var onTouchMove = function (event) {
        var _a = event.touches[0], endX = _a.pageX, endY = _a.pageY;
        var _b = touchInfo.current, startX = _b.startX, startY = _b.startY;
        if (startX !== undefined && startY !== undefined) {
            var direction = getSwipeDirection(startX, startY, endX, endY);
            // prevent default if is an valid swipe
            if (direction !== 0) {
                event.preventDefault();
            }
            touchInfo.current = __assign(__assign({}, touchInfo.current), { endX: endX, endY: endY, direction: direction });
        }
    };
    var onTouchEnd = function () {
        handleSwipe();
    };
    var onTouchCancel = function () {
        touchInfo.current = {};
    };
    var handleSwipe = function () {
        var direction = touchInfo.current.direction;
        if (direction === 1) {
            onNext();
        }
        else if (direction === -1) {
            onPrevious();
        }
        touchInfo.current = {};
    };
    return { onTouchCancel: onTouchCancel, onTouchEnd: onTouchEnd, onTouchMove: onTouchMove, onTouchStart: onTouchStart };
}
export default useCarouselSwipe;
//# sourceMappingURL=useCarouselSwipe.js.map