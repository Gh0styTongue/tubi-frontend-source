import type { ComponentType, FunctionComponent, ReactNode } from 'react';
import React, { Suspense, useEffect, useState } from 'react';

function LazyComponentWrapper<P>(
  RealComponent: React.LazyExoticComponent<ComponentType<P>>, // Use LazyExoticComponent for lazy-loaded components
  fallback: ReactNode = null
): FunctionComponent<React.PropsWithRef<P> & JSX.IntrinsicAttributes> {
  const LazyComponent = (props: React.PropsWithRef<P> & JSX.IntrinsicAttributes) => {
    // We only want to render this client-side, but we also don't want react to
    // freak out because we're rendering differently on server vs client, so we
    // always initialize `shouldRender` to false. The useEffect hook will set it
    // to true, which will only happen client-side.
    const [shouldRender, setShouldRender] = useState(false);
    useEffect(() => {
      setShouldRender(true);
    }, []);

    if (!shouldRender) {
      return null;
    }

    return (
      <Suspense fallback={fallback}>
        <RealComponent {...props} />
      </Suspense>
    );
  };
  return LazyComponent;
}

export default LazyComponentWrapper;
