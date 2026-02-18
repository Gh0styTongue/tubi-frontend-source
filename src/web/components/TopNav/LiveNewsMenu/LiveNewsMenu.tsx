import { ANALYTICS_COMPONENTS, NavSection } from '@tubitv/analytics/lib/components';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';

import { hideContainerMenu } from 'common/actions/ui';
import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import trackingManager from 'common/services/TrackingManager';
import { TopNavOption } from 'common/types/ottUI';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { TopNavContext } from 'web/components/TopNav/context';
import { topNavMessages } from 'web/components/TopNav/topNavMessages';

import styles from './LiveNewsMenu.scss';

export interface LiveNewsMenuProps {
  inverse?: boolean;
  linkTextClassname?: string;
}

const LiveNewsMenu: FC<LiveNewsMenuProps> = ({ inverse, linkTextClassname }) => {
  const dispatch = useDispatch();
  const { setShowMobileMenu } = useContext(TopNavContext);

  const textClasses = classNames(styles.liveNewsMenuText, linkTextClassname, {
    [styles.inverse]: inverse,
  });

  const onMenuTextClick = () => {
    dispatch(hideContainerMenu());
    setShowMobileMenu(false);
    trackingManager.createNavigateToPageComponent({
      endX: TopNavOption.Linear,
      componentType: ANALYTICS_COMPONENTS.topNavComponent,
    });

    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'TOP_NAV',
      section: NavSection.LINEAR,
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
  };

  return (
    <Link onClick={onMenuTextClick} to={WEB_ROUTES.live} className={textClasses}>
      <FormattedMessage {...topNavMessages.liveTV} />
    </Link>
  );
};

export default LiveNewsMenu;
