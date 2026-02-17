import { BREAKPOINTS } from 'common/constants/constants';
import type { ViewportType } from 'common/types/ui';

export const getViewportType = (isAdaptLargeMobile = false): ViewportType => {
  let media: ViewportType = 'desktop';
  if (typeof document === 'undefined') {
    return media;
  }
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

  // new responsive design: https://www.figma.com/file/2qE17TLvqxQqK9UQY8oDIE/%5BWeb%5D-Top-Nav-Updates?node-id=1209%3A20075&t=FzXWT26iJchU30BG-0
  const mobileWidthUpperBound = isAdaptLargeMobile ? BREAKPOINTS.lg : BREAKPOINTS.md;
  const tabletWidthUpperBound = BREAKPOINTS.xl;

  if (vw < mobileWidthUpperBound) {
    media = 'mobile';
  } else if (vw < tabletWidthUpperBound) {
    media = 'tablet';
  }
  return media;
};
