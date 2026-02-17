import { __assign } from "tslib";
// Doc is inside Placeholder.stories.mdx
import classNames from 'classnames';
import React from 'react';
import './Placeholder.scss';
export var PlaceholderType;
(function (PlaceholderType) {
    PlaceholderType["Text"] = "text";
    PlaceholderType["Block"] = "block";
})(PlaceholderType || (PlaceholderType = {}));
var OTT_ROOT_FONT_SIZE = 15;
var TEST_ID = 'ott-ui-placeholder';
function getRemValue(metricValue) {
    if (typeof metricValue !== 'number') {
        return metricValue;
    }
    return "".concat(metricValue / OTT_ROOT_FONT_SIZE, "rem");
}
function isTextType(props) {
    return props.type === PlaceholderType.Text;
}
var Placeholder = React.memo(function (props) {
    var isTextPlaceholder = isTextType(props);
    var style = props.style, _a = props.className, className = _a === void 0 ? '' : _a, _b = props.isTextStyle, isTextStyle = _b === void 0 ? isTextPlaceholder : _b;
    var renderClassNames = classNames('ott-placeholder', className, {
        'ott-placeholder--inline': isTextPlaceholder,
        'ott-placeholder--text': isTextStyle,
        'ott-placeholder--block': !isTextPlaceholder,
    });
    if (isTextType(props)) {
        var charCount = props.charCount;
        // Adding extra space for word break
        var texts = '&nbsp; '.repeat(Math.ceil(charCount / 2));
        return (React.createElement("span", { "data-test-id": TEST_ID, style: style, className: renderClassNames, dangerouslySetInnerHTML: { __html: texts } }));
    }
    var width = props.width, height = props.height;
    return (React.createElement("div", { "data-test-id": TEST_ID, style: __assign({ width: getRemValue(width), height: getRemValue(height) }, style), className: renderClassNames, dangerouslySetInnerHTML: { __html: '&nbsp;' } }));
});
Placeholder.displayName = 'Placeholder';
export default Placeholder;
//# sourceMappingURL=Placeholder.js.map