export function bemBlock(block) {
    return {
        block: block,
        element: function (name) { return "".concat(block, "__").concat(name); },
        modifier: function (name) { return "".concat(block, "--").concat(name); },
        elementModifier: function (elementName, modifierName) { return "".concat(block, "__").concat(elementName, "--").concat(modifierName); },
    };
}
//# sourceMappingURL=bem.js.map