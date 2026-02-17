/* istanbul ignore file */
import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { Button } from '@tubitv/web-ui';
import type { FC } from 'react';
import React, { memo, useCallback } from 'react';

import { LINEAR_CONTENT_TYPE, PURPLE_CARPET_CONTAINER_ID, VIDEO_CONTENT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isThirdPartySDKTrackingEnabledSelector } from 'common/features/coppa/selectors/coppa';
import type { useActionButton } from 'common/features/purpleCarpet/hooks/useActionButton';
import { messages } from 'common/features/purpleCarpet/hooks/useActionButton';
import type { PurpleCarpetEvent } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import { PurpleCarpetContentStatus } from 'common/features/purpleCarpet/type';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { videoByContentIdSelector } from 'common/selectors/video';
import trackingManager from 'common/services/TrackingManager';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import redirect from 'common/utils/redirect';
import { getDeepLinkForVideo, getUrl } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import useReminder from 'web/rd/components/ContentDetail/RemindButton/useReminder';

import styles from './PurpleCarpetDetails.scss';

const ActionButton: FC<{ game: PurpleCarpetEvent } & ReturnType<typeof useActionButton>> = ({
  message,
  buttonStatus,
  iconComp,
  game,
}) => {
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const isHomePage = getCurrentPathname() === WEB_ROUTES.home;
  const buttonDisabled = ['available', 'not_available'].includes(buttonStatus);
  const intl = useIntl();
  const isThirdPartySDKTrackingEnabled = useAppSelector(isThirdPartySDKTrackingEnabledSelector);
  const deviceId = useAppSelector(state => state.auth.deviceId);
  const content = useAppSelector((state) => game ? videoByContentIdSelector(state, game.id) : null);

  const { dispatchReminderAction } = useReminder({
    contentId: game?.id,
    contentTitle: game?.title,
    contentType: game?.type,
  });
  const createNavigateToPageComponent = useCallback(() => {
    if (!isHomePage) return;
    trackingManager.createNavigateToPageComponent({
      startX: 0,
      startY: 0,
      containerSlug: PURPLE_CARPET_CONTAINER_ID,
      componentType: ANALYTICS_COMPONENTS.containerComponent,
    });
  }, [isHomePage]);

  const freeTag = buttonStatus === 'signin_required' ? intl.formatMessage(messages.free) : undefined;
  const buttonProps = {
    appearance: buttonDisabled ? ('tertiary' as const) : ('primary' as const),
    children: message,
    icon: iconComp,
    iconSize: 'large' as const,
    disabled: buttonDisabled,
    tag: freeTag,
    onClick: useCallback(() => {
      if (!game || !content) return;

      switch (buttonStatus) {
        case 'set_reminder':
        case 'reminder_set':
          dispatchReminderAction?.();
          break;
        case 'signin_required':
          createNavigateToPageComponent();
          const url = getUrl({
            id: game!.id,
            title: game?.title,
            type: game?.status === PurpleCarpetContentStatus.Live && !isMobile ? LINEAR_CONTENT_TYPE : VIDEO_CONTENT_TYPE,
          });
          tubiHistory.push(`${WEB_ROUTES.signIn}?redirect=${encodeURIComponent(url)}`);
          break;
        case 'live':
          createNavigateToPageComponent();
          if (isMobile) {
            redirect(getDeepLinkForVideo(content, deviceId, {
              stopTracking: !isThirdPartySDKTrackingEnabled,
            }));
          } else {
            tubiHistory.push(getUrl({
              id: game.id,
              title: game.title,
              type: LINEAR_CONTENT_TYPE, // to linear playback page
            }));
          }
          break;
        case 'details':
          tubiHistory.push(getUrl({
            id: game.id,
            title: game.title,
            type: VIDEO_CONTENT_TYPE, // to details page
          }));
          break;
        default:
          break;
      }
    }, [buttonStatus, content, createNavigateToPageComponent, deviceId, dispatchReminderAction, game, isMobile, isThirdPartySDKTrackingEnabled]),
  };

  return (
    // eslint-disable-next-line react/forbid-component-props
    <Button className={styles.button} {...buttonProps} />
  );
};

export default memo(ActionButton);
