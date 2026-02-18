import React, { useContext, useEffect, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { ThemeContext } from 'common/features/theme/context';
import { isCreateParentFlow } from 'web/features/authentication/utils/auth';

import styles from './common.scss';
import { AddAccountContext } from './context';

const Wrapper = ({ children, location }: PropsWithChildren & WithRouterProps) => {
  const { setTheme, resetTheme } = useContext(ThemeContext);
  const isKidsFlow = isCreateParentFlow(location);
  const isKidsTheme = location.state?.theme === 'kidsDark' || isKidsFlow;

  const contextValue = useMemo(() => ({ isKidsFlow }), [isKidsFlow]);

  useEffect(() => {
    setTheme(isKidsTheme ? 'kidsDark' : 'defaultDark');
    return () => {
      resetTheme();
    };
  }, [isKidsTheme, setTheme, resetTheme]);

  return (
    <AddAccountContext.Provider value={contextValue}>
      <div className={styles.wrapper}>
        <TopPlaceholder logo invert fixed={false} login={false} />
        {children}
      </div>
    </AddAccountContext.Provider>
  );
};

export default withRouter(Wrapper);
