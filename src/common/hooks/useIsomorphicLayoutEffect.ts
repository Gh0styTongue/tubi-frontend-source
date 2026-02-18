import { useEffect, useLayoutEffect } from 'react';

/**
 * A hook that conditionally uses useLayoutEffect on the client and useEffect on the server.
 * This prevents SSR warnings about useLayoutEffect not working on the server.
 *
 * @param effect - The effect function to run
 * @param deps - The dependencies array for the effect
 */
export const useIsomorphicLayoutEffect = __SERVER__ ? useEffect : useLayoutEffect;
