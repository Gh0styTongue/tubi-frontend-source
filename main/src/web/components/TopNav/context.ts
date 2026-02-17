import { createContext } from 'react';

const emptyFunction = (_val: boolean) => {};

export const TopNavContext = createContext({
  showBrowseMenu: false,
  setShowBrowseMenu: emptyFunction,
  hoverOnBrowseText: false,
  setHoverOnBrowseText: emptyFunction,
  hoverOnBrowseMenu: false,
  setHoverOnBrowseMenu: emptyFunction,
  showMobileMenu: false,
  setShowMobileMenu: emptyFunction,
  showMobileAccountMenu: false,
  setShowMobileAccountMenu: emptyFunction,
  isSearchInputFocused: false,
  setIsSearchInputFocused: emptyFunction,
});
