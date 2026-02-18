export var SWIPE_DISTANCE_THRESHOLD = 30;
export var getSwipeDistance = function (startX, startY, endX, endY) {
    var xCoordSquared = Math.pow((startX - endX), 2);
    var yCoordSquared = Math.pow((startY - endY), 2);
    return Math.round(Math.sqrt(xCoordSquared + yCoordSquared));
};
var getSwipeDirection = function (startX, startY, endX, endY) {
    var distance = getSwipeDistance(startX, startY, endX, endY);
    if (distance < SWIPE_DISTANCE_THRESHOLD)
        return 0;
    // atan2 https://en.wikipedia.org/wiki/Atan2
    var radian = Math.atan2(endY - startY, endX - startX);
    var swipeAngle = Math.round(radian * 180 / Math.PI) + (radian < 0 ? 360 : 0);
    var swipeDirection = 0;
    if (swipeAngle <= 45 || swipeAngle >= 315) {
        swipeDirection = -1;
    }
    else if (swipeAngle >= 135 && swipeAngle <= 225) {
        swipeDirection = 1;
    }
    return swipeDirection;
};
export default getSwipeDirection;
//# sourceMappingURL=getSwipeDirection.js.map