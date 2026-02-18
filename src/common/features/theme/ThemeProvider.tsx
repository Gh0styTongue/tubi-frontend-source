import React, { useEffect, useMemo, useState } from 'react';

import { getCookie, setCookie } from 'client/utils/localDataStorage';
import type { Theme } from 'common/features/theme/type';
import useAppSelector from 'common/hooks/useAppSelector';

import { THEME_COOKIE } from './constants';
import { ThemeContext } from './context';

// For __STAGING__ or __DEVELOPMENT__, we save theme on cookie to test different theme
const getInitialTheme = (isKidsModeEnabled: boolean): Theme => {
  if (__DEVELOPMENT__ || __STAGING__) {
    const cookieTheme = getCookie(THEME_COOKIE);
    if (cookieTheme) {
      return cookieTheme as Theme;
    }
  }
  return isKidsModeEnabled ? 'kidsDark' : 'defaultDark';
};
const ThemeProvider = ({ children }: { children: React.ReactNode}) => {
  const isKidsModeEnabled = useAppSelector((state) => state.ui.isKidsModeEnabled);
  const [theme, setTheme] = useState<Theme>(getInitialTheme(isKidsModeEnabled));
  useEffect(() => {
    setTheme(getInitialTheme(isKidsModeEnabled));
  }, [isKidsModeEnabled]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        setTheme(newTheme);
        setCookie(THEME_COOKIE, newTheme);
      },
    }),
    [theme]
  );

  const themeClass = `${theme}Theme`;
  return (
    <ThemeContext.Provider value={value}>
      <div className={themeClass}>{children}</div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
