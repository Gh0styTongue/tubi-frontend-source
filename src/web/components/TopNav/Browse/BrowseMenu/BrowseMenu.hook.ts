import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { useCallback, useContext } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import trackingManager from 'common/services/TrackingManager';
import { getRemoteDebuggerStatus, setRemoteDebuggerStatus, toggleRemoteDebugger } from 'common/utils/debug';
import { TopNavContext } from 'web/components/TopNav/context';

const REMOTE_DEBUGGER_KEY = 'remote-debugger';
const FEATURE_SWITCH_KEY = 'feature-switch';

export const useMenuItemEvents = () => {
  const { setShowBrowseMenu, setHoverOnBrowseText, setHoverOnBrowseMenu, setShowMobileMenu } = useContext(TopNavContext);

  const onClickItem = useCallback(
    (e: React.MouseEvent, slug: string) => {
      if (!__PRODUCTION__ || __IS_ALPHA_ENV__) {
        if (slug === REMOTE_DEBUGGER_KEY) {
          e.preventDefault();
          const enabled = getRemoteDebuggerStatus();
          setRemoteDebuggerStatus(!enabled);
          toggleRemoteDebugger();
          return;
        }
        if (slug === FEATURE_SWITCH_KEY) {
          e.preventDefault();
          tubiHistory.push(WEB_ROUTES.featureSwitch);
          return;
        }
      }
      trackingManager.createNavigateToPageComponent({
        startX: 0,
        startY: 0,
        containerSlug: slug,
        componentType: ANALYTICS_COMPONENTS.navigationDrawerComponent,
      });
      setTimeout(() => {
        setHoverOnBrowseText(false);
        setHoverOnBrowseMenu(false);
        setShowBrowseMenu(false);
        setShowMobileMenu(false);
      }, 0);
    },
    [setHoverOnBrowseMenu, setHoverOnBrowseText, setShowBrowseMenu, setShowMobileMenu]
  );
  return { onClickItem };
};
