"use strict";
/* istanbul ignore file */
// From http://stackoverflow.com/questions/17722497/scroll-smoothly-to-specific-element-on-page
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSmoothScroll = void 0;
/**
 * @param elm, the ref to the element
 * @returns Top of the element
 */
function getElementYPos(elm) {
    var y = elm.offsetTop;
    var node = elm;
    // offsetTop checks for distance to first relative parent, so if we have multiple relative parents, keep adding up their distances
    while (node.offsetParent && node.offsetParent !== document.body) {
        node = node.offsetParent;
        y += node.offsetTop;
    }
    return y;
}
/**
 * @param elementRef, the ref of the element for scrolling
 * @param offset, target # of pixels from top of window
 * @param duration, how long the animation takes
 */
var doSmoothScroll = function (_a) {
    var elementRef = _a.elementRef, _b = _a.offset, offset = _b === void 0 ? 0 : _b, _c = _a.duration, duration = _c === void 0 ? 1000 : _c, callback = _a.callback;
    // @note - startingY and elementY are relative to top of document
    var startingY = window.pageYOffset;
    var elementY = getElementYPos(elementRef) - offset;
    var diff = elementY - startingY;
    var start;
    var easing = function (t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; };
    var step = function (timestamp) {
        if (!start)
            start = timestamp;
        var time = timestamp - start;
        var percent = easing(Math.min(time / duration, 1));
        window.scrollTo(0, startingY + diff * percent);
        if (time < duration) {
            window.requestAnimationFrame(step);
        }
        else {
            callback === null || callback === void 0 ? void 0 : callback();
        }
    };
    // eslint-disable-next-line compat/compat
    window.requestAnimationFrame(step);
};
exports.doSmoothScroll = doSmoothScroll;
//# sourceMappingURL=animate.js.map