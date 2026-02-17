import type { FetchDataParams } from 'common/types/container';

/**
 * Assuming each component defines a fetchData and/or fetchDataDeferred methods, call those and save the
 * promises. The purpose of this function is to be called before/after a route change.
 *
 * @param components the components we want to fetch data for, usually get this from the route
 * @param getState the redux getState function
 * @param dispatch redux store dispatch function
 * @param location the url of where we are, from history of the RoutingContext
 * @param params
 * @param deferred if true, look for fetchDataDeferred instead of fetchData
 * @param experimentManager the correct instance of the ExperimentManager, if experiment values are needed.
 * @param res ExpressJS response object injected by SSR in src/server/render.tsx
 * @returns {Promise|Promise<T>}
 */
export default ({
  components,
  getState,
  dispatch,
  location,
  params,
  deferred,
  experimentManager,
  res,
}: FetchDataParams<{ keywords: string }>) => {
  const methodName = deferred ? 'fetchDataDeferred' : 'fetchData';
  const fetchDataPromises = components
    .filter((component: any) => !!component && component[methodName])
    .map((component: any) => component[methodName])
    .map((fetchData: (data?: Partial<FetchDataParams<{ keywords: string }>>) => Promise<Record<string, unknown>>) =>
      fetchData({
        dispatch,
        experimentManager,
        getState,
        location,
        params,
        res,
      })
    );
  return Promise.all(fetchDataPromises);
};
