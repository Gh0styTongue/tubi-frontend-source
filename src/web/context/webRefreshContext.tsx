import React from 'react';

export const defaultWebRefreshStatus = {
  enabled: false,
};

export type WebRefreshStatus = typeof defaultWebRefreshStatus;

const WebRefreshContext = React.createContext(defaultWebRefreshStatus);

export function WebRefreshProvider(
  { value, children }: React.PropsWithChildren<{ value: WebRefreshStatus }>
) {
  return <WebRefreshContext.Provider value={value}>{children}</WebRefreshContext.Provider>;
}

export function WebRefreshConsumer(
  { children }: { children: (value: WebRefreshStatus) => React.ReactNode }
) {
  return <WebRefreshContext.Consumer>{children}</WebRefreshContext.Consumer>;
}
