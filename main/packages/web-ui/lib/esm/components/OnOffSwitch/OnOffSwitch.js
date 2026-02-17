import classNames from 'classnames';
import React, { useCallback } from 'react';
var OnOffSwitch = function (_a) {
    var switchOn = _a.switchOn, className = _a.className, toggleClassName = _a.toggleClassName, disabled = _a.disabled, onChange = _a.onChange;
    var outerCls = classNames(className, 'web-switch-container');
    var switchCls = classNames('web-switch', {
        'web-switch--switch-on': switchOn,
        'web-switch--disabled': disabled,
    });
    var toggleCls = classNames(toggleClassName, 'web-white-toggle', {
        'web-white-toggle--switch-on': switchOn,
        'web-white-toggle--disabled': disabled,
    });
    var onClick = useCallback(function () {
        if (disabled)
            return;
        /* istanbul ignore next: ignore optional chaining */
        onChange === null || onChange === void 0 ? void 0 : onChange(!switchOn);
    }, [disabled, onChange, switchOn]);
    return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    React.createElement("div", { className: outerCls, onClick: onClick, role: "switch", "aria-checked": switchOn },
        React.createElement("div", { className: switchCls }),
        React.createElement("div", { className: toggleCls })));
};
export default OnOffSwitch;
//# sourceMappingURL=OnOffSwitch.js.map