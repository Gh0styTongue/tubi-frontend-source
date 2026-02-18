import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import React, { type ComponentType } from 'react';

/**
 * Higher-order component that injects the queryClient as a prop to the wrapped component.
 *
 * @param Component - The component to wrap, must accept queryClient as a prop
 * @returns A new component that provides queryClient prop
 */
export const withQueryClient = <TProps extends { queryClient: QueryClient }>(
  Component: ComponentType<TProps>
) => {
  return (props: Omit<TProps, 'queryClient'>) => {
    const queryClient = useQueryClient();
    return <Component {...(props as TProps)} queryClient={queryClient} />;
  };
};
