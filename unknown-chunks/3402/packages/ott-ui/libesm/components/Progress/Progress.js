import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React from 'react';
import omitInvalidProps from '../../omitInvalidProps';
import './Progress.scss';
/**
 * Custom progress bar
 */
var Progress = function (props) {
    var className = props.className, percentComplete = props.percentComplete, style = props.style, animated = props.animated, attributes = __rest(props, ["className", "percentComplete", "style", "animated"]);
    if (percentComplete <= 0)
        return null;
    var width = "".concat(Math.min(1, percentComplete) * 100, "%");
    var rootClassName = classNames('ott-progress', className, {
        'ott-progress--animated': animated,
    });
    return React.createElement("div", __assign({ className: rootClassName, style: __assign({ width: width }, style) }, omitInvalidProps(attributes)));
};
Progress.displayName = 'Progress';
export default Progress;
//# sourceMappingURL=Progress.js.map