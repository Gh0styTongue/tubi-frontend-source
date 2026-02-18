import React, { useMemo } from 'react';
import type { ReactNode } from 'react';

export interface HeadingContextProps {
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

type HeadingContextValue = Required<HeadingContextProps>;

const defaultHeadingLevel = 'h2';

const HeadingContext = React.createContext<HeadingContextValue>({
  headingLevel: defaultHeadingLevel,
});

export const HeadingProvider = ({
  children,
  headingLevel = defaultHeadingLevel,
}: HeadingContextProps & { children: ReactNode }) => {
  const value = useMemo(() => ({ headingLevel }), [headingLevel]);

  return <HeadingContext.Provider value={value}>{children}</HeadingContext.Provider>;
};

export const useHeading = () => React.useContext(HeadingContext);
