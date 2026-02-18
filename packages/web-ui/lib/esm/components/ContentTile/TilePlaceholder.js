import classNames from 'classnames';
import React, { memo } from 'react';
var TilePlaceholder = function (_a) {
    var _b = _a.tileOrientation, tileOrientation = _b === void 0 ? 'portrait' : _b;
    return (React.createElement("div", { "data-test-id": "web-ui-content-tile-placeholder", className: classNames('web-tile-placeholder', 'web-content-tile', 'web-poster__image-container', {
            'web-poster__image-container--landscape': tileOrientation === 'landscape',
        }) }));
};
export default memo(TilePlaceholder);
//# sourceMappingURL=TilePlaceholder.js.map