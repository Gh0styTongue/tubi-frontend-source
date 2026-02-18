"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsomorphicLayoutEffect = void 0;
var react_1 = require("react");
/**
 * A hook that conditionally uses useLayoutEffect on the client and useEffect on the server.
 * This prevents SSR warnings about useLayoutEffect not working on the server.
 *
 * @param effect - The effect function to run
 * @param deps - The dependencies array for the effect
 */
exports.useIsomorphicLayoutEffect = typeof window !== 'undefined' ? react_1.useLayoutEffect : react_1.useEffect;
//# sourceMappingURL=useIsomorphicLayoutEffect.js.map