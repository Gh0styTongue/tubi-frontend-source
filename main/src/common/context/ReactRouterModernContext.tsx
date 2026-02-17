import type { Location, Query } from 'history';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { ComponentType, FC, PropsWithChildren } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';
import type { Params } from 'react-router/lib/Router';

type RouterProps = WithRouterProps<Params | undefined>;

export const ReactRouterModernContext = createContext<RouterProps | null>(null);

const useReactRouterModernContext = () => {
  const context = useContext(ReactRouterModernContext);
  if (!context) {
    throw new Error('useReactRouterModernContext must be rendered below a ReactRouterModernContextProvider');
  }
  return context;
};

export const ReactRouterModernContextAdapter = withRouter(
  ({ children, location, params, router, routes }: PropsWithChildren<RouterProps>) => {
    const context = useMemo(
      () => ({ location, params, router, routes }),
      [location, params, router, routes]
    );
    return (
      <ReactRouterModernContext.Provider value={context}>
        {children}
      </ReactRouterModernContext.Provider>
    );
  });

export const withReactRouterModernContextAdapter = <PROPS extends object>(Component: ComponentType<PROPS>): FC<PROPS> =>
  hoistNonReactStatics(
    (props) => (
      <ReactRouterModernContextAdapter>
        <Component {...props} />
      </ReactRouterModernContextAdapter>
    ),
    Component
  );

export const useLocation = <QUERY extends object = Query>() =>
  useReactRouterModernContext().location as Location<QUERY>;

export const useParams = () =>
  useReactRouterModernContext().params;
