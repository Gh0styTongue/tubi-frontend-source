import { useEffect } from 'react';

import { useExperiment } from 'common/experimentV2';
import { webottWebDesktopTopNav } from 'common/experimentV2/configs/webottWebDesktopTopNav';

export function useTopNavExperiment() {
  const topNavExperiment = useExperiment(webottWebDesktopTopNav);
  const topNavVariant = topNavExperiment.get('navbar_variant') as 'default' | 'topnav_sticky_with_reduced_height';
  const topNavHeight = topNavExperiment.get('top_nav_height') as number;
  const isTopNavDefaultVariant = topNavVariant === 'default';
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--experimental-top-nav-height-override', `${topNavHeight}px`);
  }, [topNavHeight]);

  return {
    topNavHeight,
    isTopNavDefaultVariant,
  };
}
