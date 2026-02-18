import type { FC } from 'react';
import type { RouteComponent, RouteProps } from 'react-router';

export const lazyGetComponent = (importPromiseFn: () => Promise<{ default: RouteComponent; }>): NonNullable<RouteProps['getComponent']> => (_nextState, callback) => importPromiseFn()
  .then(
    module => callback(null, module.default),
    (error) => callback(
      // Don't pass the error to the callback - If we did, react-router would
      // handle it by aborting the transition from the prev page to the next
      // page (so the user would stay on the prev page). For the initial render,
      // it just won't render the page. Obviously, neither scenario is ideal.
      null,
      // Instead, create an inline react component that just throws the error
      // during the render phase. The error will be caught by the closest
      // error boundary.
      (() => {
        throw error;
      }) satisfies FC
    )
  );
