import { createContext } from 'react';
import Cookie from 'react-cookie';

import { THEME_COOKIE, THEMES } from 'common/features/theme/constants';

export const ThemeContext = createContext<{
  theme: typeof THEMES[number],
  setTheme:(newTheme: typeof THEMES[number]) => void
    }>({
      theme: Cookie.load(THEME_COOKIE) || THEMES[0],
      setTheme: () => {},
    });
