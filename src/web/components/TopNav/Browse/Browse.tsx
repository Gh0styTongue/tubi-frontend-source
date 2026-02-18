import { ArrowheadDown } from '@tubitv/icons';
import { useHover } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useContext, useEffect, memo, useCallback } from 'react';
import { defineMessages } from 'react-intl';
import { Link } from 'react-router';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { webAllCategoriesExperimentSelector } from 'common/selectors/experiments/webAllCategories';
import { trackLogging } from 'common/utils/track';
import { useIntl } from 'i18n/intl';
import { TopNavContext } from 'web/components/TopNav/context';

import styles from './Browse.scss';
import BrowseMenu from './BrowseMenu/BrowseMenu';

const messages = defineMessages({
  browse: {
    description: 'browse menu title',
    defaultMessage: 'Browse',
  },
});

const Browse: FC<{ className?: string; inverted?: boolean, onClickBrowse?: () => void }> = ({ className, inverted, onClickBrowse }) => {
  const viewportType = useAppSelector((state) => state.ui.viewportType);
  const isEnabledNewFlyoverMenu = useAppSelector(webAllCategoriesExperimentSelector);
  const isMobile = viewportType === 'mobile';
  const isTablet = viewportType === 'tablet';
  const isDesktop = viewportType === 'desktop';
  const [callbackRef, isHovered] = useHover({ delay: 200, skip: !isDesktop });
  const { showBrowseMenu, setShowBrowseMenu, setHoverOnBrowseText, hoverOnBrowseMenu } = useContext(TopNavContext);
  const intl = useIntl();

  useEffect(() => {
    if (isDesktop) {
      if (!isHovered && !hoverOnBrowseMenu) {
        setShowBrowseMenu(false);
      }
      if (isHovered) {
        setShowBrowseMenu(true);
        trackLogging({
          type: TRACK_LOGGING.clientInfo,
          subtype: LOG_SUB_TYPE.SHOW_BROWSER_MENU_ON_WEB,
          message: { viewportType: 'desktop' },
        });
      }
      setHoverOnBrowseText(isHovered);
    }
  }, [hoverOnBrowseMenu, isDesktop, isHovered, isMobile, setHoverOnBrowseText, setShowBrowseMenu]);

  const handleClickBrowse = useCallback(() => {
    if (isEnabledNewFlyoverMenu && isDesktop) {
      onClickBrowse?.();
      return;
    }
    // for tablet, it only can be open when click "Browse"
    if (isTablet) {
      setShowBrowseMenu(true);
      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: LOG_SUB_TYPE.SHOW_BROWSER_MENU_ON_WEB,
        message: { viewportType: 'tablet' },
      });
    }
  }, [isDesktop, isEnabledNewFlyoverMenu, isTablet, onClickBrowse, setShowBrowseMenu]);
  const classname = classnames(className, styles.browse, {
    [styles.opened]: showBrowseMenu,
    [styles.inverted]: inverted,
  });
  return (
    <React.Fragment>
      {!isMobile ? (
        isEnabledNewFlyoverMenu && isDesktop ? (
          <Link to={WEB_ROUTES.categories}>
            <button className={classname} ref={callbackRef} onClick={handleClickBrowse}>
              <span>{intl.formatMessage(messages.browse)}</span>
              <ArrowheadDown />
            </button>
          </Link>
        ) : (
          <button className={classname} ref={callbackRef} onClick={handleClickBrowse}>
            <span>{intl.formatMessage(messages.browse)}</span>
          </button>
        )
      ) : null}
      <BrowseMenu className={styles.menu} inverted={inverted} />
    </React.Fragment>
  );
};

export default memo(Browse);
