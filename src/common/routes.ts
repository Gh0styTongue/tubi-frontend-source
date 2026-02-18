import type { Request } from 'express';
import { match } from 'react-router';
import type { PlainRoute, MatchCallback } from 'react-router';
import type { Store } from 'redux';

type GetRoutes = (store: Store, req?: Request) => PlainRoute[];

const getRoutes: GetRoutes = __ISOTT__ ? require('./ottRoutes').default : require('./webRoutes').default;

export async function matchRouteFromUrl(routes: PlainRoute[], url: string) {
  // Simulate path.join, for use in browser too
  const pathJoin = (parts: string[]) => parts.join('/').replace(/\/+/g, '/');

  const [error, redirectLocation, renderProps] = await new Promise<Parameters<MatchCallback>>((resolve) =>
    match({ routes, location: url }, (...args) => resolve(args))
  );
  return {
    error,
    redirectLocation,
    renderProps,
    routePath: renderProps?.routes ? pathJoin(renderProps.routes.map((route: PlainRoute) => route.path || '')) : '',
  };
}

export default getRoutes;
